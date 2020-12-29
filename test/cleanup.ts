import { TestUtil } from './utils/TestUtil';
import { upgrades } from 'hardhat';

before(() => {
  // Silence Potentially unsafe deployment warnings
  upgrades.silenceWarnings();
});

afterEach(async () => {
  await TestUtil.resetBlockTimestamp();
});
