'use strict';

import { runTestFromJSON } from '../utils';

suite('Multi-file navigation', function () {
	this.timeout(10000);
	runTestFromJSON(__dirname, 'navigation.test.json');
});
