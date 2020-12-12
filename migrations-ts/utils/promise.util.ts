import * as _ from 'lodash';

export class PromiseUtil {
  static batchPromises = async <T>(
    promiseFns: (() => Promise<T>)[],
    batchSize: number,
    title: string,
    delay = 0
  ): Promise<T[]> => {
    console.log(`============ ${title} - starting ==========`);
    const results: T[] = [];

    const chunks = _.chunk(promiseFns, batchSize);

    console.log('chuck count', chunks.length);

    let idx = 1;
    for (const chunk of chunks) {
      console.log(`chunk ${idx}/${chunks.length} starting`);
      results.push(
        ...(await Promise.all(
          chunk.map((fn, itemIdx) => {
            return fn().then((res) => {
              console.log(`chunk ${idx}, idx: ${itemIdx}`);
              return res;
            });
          })
        ))
      );
      console.log(`chunk ${idx} finished`);
      await new Promise((res) => setTimeout(res, delay * 1000));
      idx++;
    }

    console.log(`============ ${title} - done ==========`);

    return results;
  };
}
