import { logger } from '@utils/logger';
import { ethers } from 'ethers';
import config from '@config';
import { eTokenABI, pTokenABI, universalBalanceABI } from '@config/abi';
import BaseService from '@services/baseService.service';

interface TokenConfig {
  address: string;
  decimals: number;
}

interface CurvanceConfig {
  eTokens: {
    USDC: TokenConfig;
    WBTC: TokenConfig;
    aUSD: TokenConfig;
  };
  pTokens: {
    LUSD: TokenConfig;
    USDC: TokenConfig;
    WBTC: TokenConfig;
  };
}

class CurvanceService extends BaseService {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private config: CurvanceConfig = {
    eTokens: {
      USDC: { 
        address: config.curvance.contracts.eTokens.USDC, 
        decimals: config.curvance.decimals.USDC 
      },
      WBTC: { 
        address: config.curvance.contracts.eTokens.WBTC, 
        decimals: config.curvance.decimals.WBTC 
      },
      aUSD: { 
        address: config.curvance.contracts.eTokens.aUSD, 
        decimals: config.curvance.decimals.aUSD 
      },
    },
    pTokens: {
      LUSD: { 
        address: config.curvance.contracts.pTokens.LUSD, 
        decimals: config.curvance.decimals.LUSD 
      },
      USDC: { 
        address: config.curvance.contracts.pTokens.USDC, 
        decimals: config.curvance.decimals.USDC 
      },
      WBTC: { 
        address: config.curvance.contracts.pTokens.WBTC, 
        decimals: config.curvance.decimals.WBTC 
      },
    },
  };

  constructor() {
    super();
    this.provider = new ethers.providers.JsonRpcProvider(config.chain.rpcUrl);
    this.wallet = new ethers.Wallet(config.chain.privateKey, this.provider);
  }

  private formatBigNumber(bn: ethers.BigNumber, decimals: number): string {
    return ethers.utils.formatUnits(bn, decimals);
  }

  async getMarketData() {
    try {
      const marketData = {
        interestRates: {},
        collateralRatios: {},
        liquidity: {},
        balances: {},
      };

      // Fetch data for each eToken with better error handling
      for (const [symbol, token] of Object.entries(this.config.eTokens)) {
        try {
          const eTokenContract = this.getETokenContract(token.address);
          
          // Fetch each value separately with error handling
          let interestRate = '0';
          let totalBorrows = '0';
          let totalSupply = '0';
          let balance = '0';

          try {
            interestRate = await eTokenContract.interestRateModel();
          } catch (error) {
            logger.warn({
              message: `Failed to fetch interest rate for ${symbol}`,
              error: error.message,
              labels: { origin: 'CurvanceService' },
            });
          }

          try {
            totalBorrows = await eTokenContract.totalBorrows();
          } catch (error) {
            logger.warn({
              message: `Failed to fetch total borrows for ${symbol}`,
              error: error.message,
              labels: { origin: 'CurvanceService' },
            });
          }

          try {
            totalSupply = await eTokenContract.totalSupply();
          } catch (error) {
            logger.warn({
              message: `Failed to fetch total supply for ${symbol}`,
              error: error.message,
              labels: { origin: 'CurvanceService' },
            });
          }

          try {
            balance = await this.getTokenBalance(token.address);
          } catch (error) {
            logger.warn({
              message: `Failed to fetch balance for ${symbol}`,
              error: error.message,
              labels: { origin: 'CurvanceService' },
            });
          }

          marketData.interestRates[symbol] = this.formatBigNumber(ethers.BigNumber.from(interestRate), 18);
          marketData.liquidity[symbol] = {
            totalBorrows: this.formatBigNumber(ethers.BigNumber.from(totalBorrows), token.decimals),
            totalSupply: this.formatBigNumber(ethers.BigNumber.from(totalSupply), token.decimals),
          };
          marketData.balances[symbol] = this.formatBigNumber(ethers.BigNumber.from(balance), token.decimals);

        } catch (error) {
          logger.error({
            message: `Failed to process ${symbol} eToken data`,
            error: error.message,
            token: symbol,
            address: token.address,
            labels: { origin: 'CurvanceService' },
          });
          // Set default values
          marketData.interestRates[symbol] = '0';
          marketData.liquidity[symbol] = { totalBorrows: '0', totalSupply: '0' };
          marketData.balances[symbol] = '0';
        }
      }

      // Fetch data for each pToken with better error handling
      for (const [symbol, token] of Object.entries(this.config.pTokens)) {
        try {
          const pTokenContract = this.getPTokenContract(token.address);
          
          let collateralRatio = '0';
          let balance = '0';

          try {
            collateralRatio = await pTokenContract.balanceOfUnderlying(this.wallet.address);
          } catch (error) {
            logger.warn({
              message: `Failed to fetch collateral ratio for ${symbol}`,
              error: error.message,
              labels: { origin: 'CurvanceService' },
            });
          }

          try {
            balance = await this.getTokenBalance(token.address);
          } catch (error) {
            logger.warn({
              message: `Failed to fetch balance for p${symbol}`,
              error: error.message,
              labels: { origin: 'CurvanceService' },
            });
          }

          marketData.collateralRatios[symbol] = this.formatBigNumber(ethers.BigNumber.from(collateralRatio), token.decimals);
          marketData.balances[`p${symbol}`] = this.formatBigNumber(ethers.BigNumber.from(balance), token.decimals);

        } catch (error) {
          logger.error({
            message: `Failed to process ${symbol} pToken data`,
            error: error.message,
            token: symbol,
            address: token.address,
            labels: { origin: 'CurvanceService' },
          });
          // Set default values
          marketData.collateralRatios[symbol] = '0';
          marketData.balances[`p${symbol}`] = '0';
        }
      }

      logger.info({
        message: 'Curvance Market Data',
        data: marketData,
        labels: { origin: 'CurvanceService' },
      });

      return marketData;

    } catch (error) {
      logger.error({
        message: `Error fetching Curvance market data: ${error.message}`,
        error,
        labels: { origin: 'CurvanceService' },
      });
      // Return default market data structure instead of throwing
      return {
        interestRates: {},
        collateralRatios: {},
        liquidity: {},
        balances: {},
      };
    }
  }

  private getETokenContract(address: string) {
    return new ethers.Contract(address, eTokenABI, this.wallet);
  }

  private getPTokenContract(address: string) {
    return new ethers.Contract(address, pTokenABI, this.wallet);
  }

  private async getTokenBalance(tokenAddress: string): Promise<string> {
    try {
      const contract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );
      return await contract.balanceOf(this.wallet.address);
    } catch (error) {
      logger.error({
        message: `Error getting token balance: ${error.message}`,
        tokenAddress,
        error,
        labels: { origin: 'CurvanceService' },
      });
      return '0';
    }
  }

  private async ensureDelegateApproval(contractType: 'eToken' | 'pToken' | 'universalBalance', token?: string) {
    try {
      const delegateAddress = config.curvance.delegateAddress;
      if (!delegateAddress) {
        throw new Error('Delegate address not configured');
      }

      let contract;
      if (contractType === 'eToken' && token) {
        contract = this.getETokenContract(this.config.eTokens[token].address);
      } else if (contractType === 'pToken' && token) {
        contract = this.getPTokenContract(this.config.pTokens[token].address);
      } else if (contractType === 'universalBalance') {
        contract = this.getUniversalBalanceContract();
      } else {
        throw new Error('Invalid contract type or missing token');
      }

      const isApproved = await contract.isDelegateApproved(this.wallet.address, delegateAddress);
      if (!isApproved) {
        logger.info({
          message: `Setting delegate approval for ${token || 'UniversalBalance'}`,
          contractType,
          token,
          delegate: delegateAddress,
          labels: { origin: 'CurvanceService' },
        });

        const tx = await contract.setDelegateApproval(delegateAddress, true);
        await tx.wait();

        logger.info({
          message: `Successfully set delegate approval for ${token || 'UniversalBalance'}`,
          txHash: tx.hash,
          labels: { origin: 'CurvanceService' },
        });
      }
      return true;
    } catch (error) {
      logger.error({
        message: `Failed to set delegate approval`,
        error: error.message,
        contractType,
        token,
        labels: { origin: 'CurvanceService' },
      });
      return false;
    }
  }

  async depositFunds(amount: string, token: string) {
    try {
      // Check approval before deposit
      await this.ensureDelegateApproval('universalBalance');
      
      const balance = await this.getTokenBalance(this.config.eTokens[token].address);
      if (ethers.BigNumber.from(balance).lt(ethers.BigNumber.from(amount))) {
        throw new Error(`Insufficient ${token} balance for deposit`);
      }

      logger.info({
        message: `Depositing ${amount} ${token}`,
        balance,
        amount,
        token,
        labels: { origin: 'CurvanceService' },
      });

      const universalBalanceContract = this.getUniversalBalanceContract();
      const tx = await universalBalanceContract.depositFor(amount, true, this.wallet.address);
      await tx.wait();

      logger.info({
        message: `Successfully deposited ${amount} ${token}`,
        txHash: tx.hash,
        labels: { origin: 'CurvanceService' },
      });

      return tx;
    } catch (error) {
      logger.error({
        message: `Error depositing funds: ${error.message}`,
        token,
        amount,
        error,
        labels: { origin: 'CurvanceService' },
      });
      throw error;
    }
  }

  async withdrawFunds(amount: string, token: string, recipientAddress: string) {
    try {
      // Check approvals before withdrawal
      await Promise.all([
        this.ensureDelegateApproval('pToken', token),
        this.ensureDelegateApproval('universalBalance')
      ]);
      
      const balance = await this.getTokenBalance(this.config.pTokens[token].address);
      if (ethers.BigNumber.from(balance).lt(ethers.BigNumber.from(amount))) {
        throw new Error(`Insufficient ${token} balance for withdrawal`);
      }

      logger.info({
        message: `Withdrawing ${amount} ${token}`,
        balance,
        amount,
        token,
        recipient: recipientAddress,
        labels: { origin: 'CurvanceService' },
      });

      const universalBalanceContract = this.getUniversalBalanceContract();
      const tx = await universalBalanceContract.withdrawFor(amount, false, recipientAddress, this.wallet.address);
      await tx.wait();

      logger.info({
        message: `Successfully withdrew ${amount} ${token}`,
        txHash: tx.hash,
        labels: { origin: 'CurvanceService' },
      });

      return tx;
    } catch (error) {
      logger.error({
        message: `Error withdrawing funds: ${error.message}`,
        token,
        amount,
        recipient: recipientAddress,
        error,
        labels: { origin: 'CurvanceService' },
      });
      throw error;
    }
  }

  async borrowFunds(amount: string, token: string, recipientAddress: string) {
    try {
      // Check approval before borrowing
      await this.ensureDelegateApproval('eToken', token);
      
      // Check borrowing power/limit before proceeding
      const eTokenContract = this.getETokenContract(this.config.eTokens[token].address);
      const borrowLimit = await eTokenContract.getBorrowingPower(this.wallet.address);
      
      if (ethers.BigNumber.from(borrowLimit).lt(ethers.BigNumber.from(amount))) {
        throw new Error(`Insufficient borrowing power for ${token}`);
      }

      logger.info({
        message: `Borrowing ${amount} ${token}`,
        borrowLimit,
        amount,
        token,
        recipient: recipientAddress,
        labels: { origin: 'CurvanceService' },
      });

      const tx = await eTokenContract.borrowFor(this.wallet.address, recipientAddress, amount);
      await tx.wait();

      logger.info({
        message: `Successfully borrowed ${amount} ${token}`,
        txHash: tx.hash,
        labels: { origin: 'CurvanceService' },
      });

      return tx;
    } catch (error) {
      logger.error({
        message: `Error borrowing funds: ${error.message}`,
        token,
        amount,
        recipient: recipientAddress,
        error,
        labels: { origin: 'CurvanceService' },
      });
      throw error;
    }
  }

  private getUniversalBalanceContract() {
    const address = config.curvance.contracts.universalBalance;
    return new ethers.Contract(address, universalBalanceABI, this.wallet);
  }
}

export default CurvanceService; 