import fs from 'fs';
import path from 'path';

export class FileUtil {
  private static snapshotFolder = path.join(__dirname, '..');

  static saveSnapshot(fileName: string, snapshot: any) {
    fs.writeFileSync(
      path.join(FileUtil.snapshotFolder, fileName),
      JSON.stringify(snapshot, null, 2)
    );
  }
}
