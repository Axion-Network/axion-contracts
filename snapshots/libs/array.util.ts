import _ from 'lodash'

export class ArrayUtil {
  static getRandomElement<T>(array: T[]): T {
    return _.sample(array) as T
  }
}
