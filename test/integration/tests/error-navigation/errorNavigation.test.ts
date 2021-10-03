'use strict';

import { runTestFromJSON } from '../utils';

suite('Error Navigation', function () {
	this.timeout(10000);
	runTestFromJSON(__dirname, 'errorNavigation.test.json');
});
