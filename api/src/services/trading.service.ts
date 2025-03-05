import {
  createWalletClient,
  http,
  getContract,
  erc20Abi,
  parseUnits,
  publicActions,
  numberToHex,
  size,
  concat,
  type Hex,
  formatUnits
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';
import config from '@config';

export class TradingService {
  private client;
  private headers;

  constructor() {
    if (!config.chain.privateKey) throw new Error('missing PRIVATE_KEY');
    if (!config.zeroEx.apiKey) throw new Error('missing ZERO_EX_API_KEY');
    if (!config.chain.rpcUrl) throw new Error('missing RPC_URL');

    this.client = createWalletClient({
      account: privateKeyToAccount(`0x${config.chain.privateKey}` as `0x${string}`),
      chain: monadTestnet,
      transport: http(config.chain.rpcUrl)
    }).extend(publicActions);

    this.headers = new Headers({
      'Content-Type': 'application/json',
      '0x-api-key': config.zeroEx.apiKey,
      '0x-chain-id': this.client.chain.id.toString(),
      '0x-version': 'v2'
    });
  }

  async executeSwap(action: 'buy' | 'sell', amount: string) {
    const [sellToken, buyToken] = action === 'buy' 
      ? [config.contracts.USDT, config.contracts.WBTC]
      : [config.contracts.WBTC, config.contracts.USDT];

    const tokenContract = getContract({
      address: sellToken,
      abi: erc20Abi,
      client: this.client
    });

    const decimals = await tokenContract.read.decimals();
    const sellAmount = parseUnits(amount, decimals);

    // Check and handle allowance
    await this.handleAllowance(tokenContract, sellAmount);

    // Get price quote
    const quote = await this.getQuote(sellToken, buyToken, sellAmount);
    
    if (!quote.liquidityAvailable) {
      throw new Error('No liquidity available for this swap');
    }

    // Execute the swap
    return this.executeTransaction(quote);
  }

  private async handleAllowance(contract: any, amount: bigint) {
    const spender = config.contracts.PERMIT2;
    const currentAllowance = await contract.read.allowance([
      this.client.account.address,
      spender
    ]);

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
      taker: this.client.account.address
    });

    const response = await fetch(
      `${config.zeroEx.baseUrl}/swap/permit2/quote?${params}`,
      { headers: this.headers }
    );

    if (!response.ok) {
      throw new Error('Failed to get quote');
    }

    return response.json();
  }

  private async executeTransaction(quote: any) {
    const signature = await this.client.signTypedData(quote.permit2.eip712);
    
    const signatureLengthInHex = numberToHex(size(signature), {
      signed: false,
      size: 32
    }) as Hex;

    const transactionData = quote.transaction.data as Hex;
    quote.transaction.data = concat([
      transactionData,
      signatureLengthInHex,
      signature as Hex
    ]);

    const hash = await this.client.sendTransaction({
      account: this.client.account,
      chain: this.client.chain,
      to: quote.transaction.to,
      data: quote.transaction.data,
      value: BigInt(quote.transaction.value || 0),
      gas: quote.gas ? BigInt(quote.gas) : undefined,
      gasPrice: quote.gasPrice ? BigInt(quote.gasPrice) : undefined
    });

    return this.client.waitForTransactionReceipt({ hash });
  }

  async getTokenBalance(tokenAddress: string): Promise<bigint> {
    const tokenContract = getContract({
      address: tokenAddress,
      abi: erc20Abi,
      client: this.client
    });

    const balance = await tokenContract.read.balanceOf([this.client.account.address]);
    return balance;
  }

  async calculateTradeAmount(action: 'buy' | 'sell', riskLevel: 'HIGH' | 'LOW'): Promise<string> {
    const tokenAddress = action === 'buy' ? config.contracts.USDT : config.contracts.WBTC;
    const balance = await this.getTokenBalance(tokenAddress);
    
    const tokenContract = getContract({
      address: tokenAddress,
      abi: erc20Abi,
      client: this.client
    });
    
    const decimals = await tokenContract.read.decimals();
    const percentage = riskLevel === 'HIGH' ? 0.05 : 0.1; // 5% for high risk, 10% for low risk
    
    // Calculate trade amount based on percentage of balance
    const tradeAmount = (balance * BigInt(Math.floor(percentage * 100))) / BigInt(100);
    
    // Convert from raw amount to decimal string
    return formatUnits(tradeAmount, decimals);
  }
} 