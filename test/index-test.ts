import {
  executeCompile,
} from '../src/index';

describe('index', function() {
  describe('executeCompile', function() {
    it('hello', function() {
      executeCompile('./foo/bar');
    });
  });
});
