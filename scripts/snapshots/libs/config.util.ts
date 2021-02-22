require('dotenv').config()

export class ConfigUtil {
  static getInfuraNodeUrl1() {
    return process.env['INFURA_NODE_URL1'] as string
  }
  static getInfuraNodeUrl2() {
    return process.env['INFURA_NODE_URL2'] as string
  }
  static getInfuraNodeUrl3() {
    return process.env['INFURA_NODE_URL3'] as string
  }
  static getInfuraNodeUrl4() {
    return process.env['INFURA_NODE_URL4'] as string
  }
  static getInfuraNodeUrl5() {
    return process.env['INFURA_NODE_URL5'] as string
  }
  static getInfuraNodeUrl6() {
    return process.env['INFURA_NODE_URL6'] as string
  }
  static getInfuraNodeUrl7() {
    return process.env['INFURA_NODE_URL7'] as string
  }

  static getStartBlock() {
    return Number(process.env['START_BLOCK'])
  }

  static getEndBlock() {
    return Number(process.env['END_BLOCK'])
  }

  static getNumDays() {
    return Number(process.env['NUM_DAYS'])
  }

  static getNumBpdPools() {
    return Number(process.env['NUM_BPD_POOLS'])
  }
}
