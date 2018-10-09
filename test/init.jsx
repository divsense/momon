import test from 'ava';
import {init} from '../index.js'

test('init', t => {

    const mond = init({})

    t.truthy(mond);
    t.truthy(mond.run);
    t.truthy(mond.runP);
    t.truthy(mond.eval);
    t.truthy(mond.evalP);

});

