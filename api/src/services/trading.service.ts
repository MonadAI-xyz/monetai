import BaseService from '@services/baseService.service';
import { concat, createWalletClient, erc20Abi, formatUnits, getContract, type Hex, http, numberToHex, parseUnits, publicActions, size } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';
import config from '@config';
import { TradeLog } from '@interfaces/trade.types';
import { logger } from '@utils/logger';
import { HttpError } from '@exceptions/http/HttpError';
import { sequelizeQueryBuilder } from '@utils/utils';
import { TradingHistory } from '@models';
import { GetContractReturnType } from 'viem';

class TradingService extends BaseService {
  private client;
  private headers;

  constructor() {
    super(TradingHistory);
    if (!config.chain.privateKey) throw new Error('missing PRIVATE_KEY');
    if (!config.zeroEx.apiKey) throw new Error('missing ZERO_EX_API_KEY');
    if (!config.chain.rpcUrl) throw new Error('missing RPC_URL');

    this.client = createWalletClient({
      account: privateKeyToAccount(`0x${config.chain.privateKey}` as `0x${string}`),
      chain: monadTestnet,
      transport: http(config.chain.rpcUrl),
    }).extend(publicActions);

    this.headers = new Headers({
      'Content-Type': 'application/json',
      '0x-api-key': config.zeroEx.apiKey,
      '0x-chain-id': this.client.chain.id.toString(),
      '0x-version': 'v2',
    });
  }

  async executeSwap(action: 'buy' | 'sell', pair: string, amount: string, decision: any) {
    const [sellToken, buyToken] = action === 'buy' ? [config.contracts.USDT, config.contracts.WBTC] : [config.contracts.WBTC, config.contracts.USDT];

    // Check balances first
    const balance = await this.getTokenBalance(sellToken);
    const tokenContract: any = getContract({
      address: sellToken as `0x${string}`,
      abi: erc20Abi,
      client: this.client,
    });

    const decimals = await tokenContract.read.decimals();
    const sellAmount = parseUnits(amount, decimals);

    if (balance < sellAmount) {
      const formattedBalance = formatUnits(balance, decimals);
      logger.error({
        message: `Insufficient balance for trade [${pair}]`,
        balance: formattedBalance,
        required: amount,
        token: sellToken,
        labels: { origin: 'TradingService' },
      });
      throw new Error(`Insufficient balance. Have: ${formattedBalance}, Need: ${amount}`);
    }

    // Create trade log entry
    const tradeLog: TradeLog = {
      timestamp: new Date(),
      pair,
      action: action.toUpperCase() as 'BUY' | 'SELL',
      tokenIn: sellToken,
      tokenOut: buyToken,
      amountIn: amount,
      expectedAmountOut: '0', // Will be updated with quote
      txHash: '',
      status: 'PENDING',
      decisionId: decision?.id || null,
    };

    try {
      // Check and handle allowance
      await this.handleAllowance(tokenContract, sellAmount);

      // Get price quote
      const quote = await this.getQuote(sellToken, buyToken, sellAmount);

      if (!quote.liquidityAvailable) {
        tradeLog.status = 'FAILED';
        tradeLog.error = 'No liquidity available';
        await this.logTrade(tradeLog);
        throw new Error('No liquidity available for this swap');
      }

      // Update expected amount
      tradeLog.expectedAmountOut = formatUnits(BigInt(quote.buyAmount), await this.getTokenDecimals(buyToken));

      // Execute the swap
      const receipt = await this.executeTransaction(quote);

      // Update trade log with success
      tradeLog.status = 'COMPLETED';
      tradeLog.txHash = receipt.transactionHash;
      await this.logTrade(tradeLog);

      return receipt;
    } catch (error) {
      // Update trade log with failure
      tradeLog.status = 'FAILED';
      tradeLog.error = error.message;
      await this.logTrade(tradeLog);
      throw error;
    }
  }

  private async handleAllowance(contract: any, amount: bigint) {
    const spender = config.contracts.PERMIT2;
    const currentAllowance = await contract.read.allowance([this.client.account.address, spender]);

    if (currentAllowance < amount) {
      const hash = await contract.write.approve([spender, amount]);
      await this.client.waitForTransactionReceipt({ hash });
    }
  }

  private async getQuote(sellToken: string, buyToken: string, sellAmount: bigint) {
    const params = new URLSearchParams({
      chainId: this.client.chain.id.toString(),
      sellToken,
      buyToken,
      sellAmount: sellAmount.toString(),
      taker: this.client.account.address,
    });

    const response = await fetch(`${config.zeroEx.baseUrl}/swap/permit2/quote?${params}`, { headers: this.headers });

    if (!response.ok) {
      throw new Error('Failed to get quote');
    }

    return response.json();
  }

  private async executeTransaction(quote: any) {
    const signature = await this.client.signTypedData(quote.permit2.eip712);

    const signatureLengthInHex = numberToHex(size(signature), {
      signed: false,
      size: 32,
    }) as Hex;

    const transactionData = quote.transaction.data as Hex;
    quote.transaction.data = concat([transactionData, signatureLengthInHex, signature as Hex]);

    const hash = await this.client.sendTransaction({
      account: this.client.account,
      chain: this.client.chain,
      to: quote.transaction.to,
      data: quote.transaction.data,
      value: BigInt(quote.transaction.value || 0),
      gas: quote.gas ? BigInt(quote.gas) : undefined,
      gasPrice: quote.gasPrice ? BigInt(quote.gasPrice) : undefined,
    });

    return this.client.waitForTransactionReceipt({ hash });
  }

  async getTokenBalance(tokenAddress: string): Promise<bigint> {
    const tokenContract: any = getContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      client: this.client,
    });

    return await tokenContract.read.balanceOf([this.client.account.address]);
  }

  async calculateTradeAmount(action: 'buy' | 'sell', riskLevel: 'HIGH' | 'LOW', pair: string = 'BTCUSD'): Promise<string> {
    const tokenAddress = action === 'buy' ? config.contracts.USDT : config.contracts.WBTC;
    const balance = await this.getTokenBalance(tokenAddress);

    const tokenContract: any = getContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      client: this.client,
    });

    const decimals = await tokenContract.read.decimals();
    const percentage = riskLevel === 'HIGH' ? 0.05 : 0.1; // 5% for high risk, 10% for low risk

    // Calculate trade amount based on percentage of balance
    const tradeAmount = (balance * BigInt(Math.floor(percentage * 100))) / BigInt(100);

    // Convert from raw amount to decimal string
    return formatUnits(tradeAmount, decimals);
  }

  private async getTokenDecimals(tokenAddress: string): Promise<number> {
    const contract: any = getContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      client: this.client,
    });
    return contract.read.decimals();
  }

  private async logTrade(tradeLog: TradeLog): Promise<void> {
    const message = 'Trade Execution';
    logger.info({
      message,
      trade: tradeLog,
      labels: { origin: 'TradingService', type: 'TRADE_LOG' },
    });

    await TradingHistory.create({ ...tradeLog, message });
  }

  async checkTradeViability(action: 'buy' | 'sell', pair: string = 'BTCUSD'): Promise<{
    viable: boolean;
    balance: string;
    token: string;
    reason?: string;
  }> {
    const tokenAddress = action === 'buy' ? config.contracts.USDT : config.contracts.WBTC;
    const balance = await this.getTokenBalance(tokenAddress);

    const tokenContract: any = getContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      client: this.client,
    });

    const decimals = await tokenContract.read.decimals();
    const formattedBalance = formatUnits(balance, decimals);

    // Consider minimum viable amounts (e.g., 1 USDT or 0.0001 WBTC)
    const minAmount = action === 'buy' ? '1' : '0.0001';

    if (balance === BigInt(0)) {
      return {
        viable: false,
        balance: '0',
        token: tokenAddress,
        reason: `No ${action === 'buy' ? 'USDT' : 'WBTC'} balance available for trade`,
      };
    }

    if (parseFloat(formattedBalance) < parseFloat(minAmount)) {
      return {
        viable: false,
        balance: formattedBalance,
        token: tokenAddress,
        reason: `Balance too low for trade. Minimum required: ${minAmount}`,
      };
    }

    return {
      viable: true,
      balance: formattedBalance,
      token: tokenAddress,
    };
  }

  /**
   * Retrieves trading history
   *
   * @param {any} options - Search and pagination options
   * @returns {Promise<TradingHistory>} - TradingHistory.
   * @throws {HttpError} - Error if something goes wrong
   */
  public getTradingHistory = async (
    options: any,
  ): Promise<{
    count: number;
    rows: TradingHistory[];
  }> => {
    try {
      const search = sequelizeQueryBuilder(options, ['pair']);
      return await this.model.findAndCountAll({
        ...search,
        include: [
          {
            association: 'decision',
          },
        ],
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      console.error('Error retrieving data:', error);
      throw new HttpError({
        message: 'Can not retrieve trading logs',
        errors: error,
      });
    }
  };
}

export default TradingService;
