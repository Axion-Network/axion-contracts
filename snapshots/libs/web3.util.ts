import Web3 from 'web3'
import { ConfigUtil } from './config.util'

export class Web3Util {
  static idx = 0

  static web3s = [
    new Web3(
      new Web3.providers.WebsocketProvider(ConfigUtil.getInfuraNodeUrl1())
    ),
    new Web3(
      new Web3.providers.WebsocketProvider(ConfigUtil.getInfuraNodeUrl2())
    ),
    new Web3(
      new Web3.providers.WebsocketProvider(ConfigUtil.getInfuraNodeUrl3())
    ),
    new Web3(
      new Web3.providers.WebsocketProvider(ConfigUtil.getInfuraNodeUrl4())
    ),
    new Web3(
      new Web3.providers.WebsocketProvider(ConfigUtil.getInfuraNodeUrl5())
    ),
    new Web3(
      new Web3.providers.WebsocketProvider(ConfigUtil.getInfuraNodeUrl6())
    ),
    new Web3(
      new Web3.providers.WebsocketProvider(ConfigUtil.getInfuraNodeUrl7())
    ),
  ]

  static getWeb3() {
    return Web3Util.getNextWeb3()
  }

  static getNextWeb3() {
    const web3 = Web3Util.web3s[Web3Util.idx % Web3Util.web3s.length]
    Web3Util.idx = Web3Util.idx + 1
    return web3
  }
}
