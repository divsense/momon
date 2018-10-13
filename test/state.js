import test from 'ava';
import R from 'ramda';
import {init, read, write, readProp, writeProp, pure, tap, mapM} from '../index.js'

var mond
const state0 = {a: 4, b: 'foo'}

test.beforeEach('init', t => {
    mond = init(state0)
})

test('pure', t => {
    const x = pure(1)

    const [v,s] = mond.eval(x)

    t.truthy(x);
    t.is(v, 1)
    t.deepEqual(s, state0)
});

test('map', t => {
    const mf = R.composeK(mapM(a => a + 1), pure)

    const x = mond.run(mf(2))

    t.is(x, 3);
});

test('read', t => {

    const x = mond.run(read())

    t.deepEqual(x, state0);
});

test('write', t => {
    const mf = R.composeK(write, mapM(R.over(R.lensProp('a'), R.add(2))), read)

    const [v, s] = mond.eval(mf())

    t.deepEqual(s, {a: 6, b: 'foo'})
});

test('readProp', t => {

    const readB = readProp('b')

    const v = mond.run(readB())

    t.is(v, 'foo')
});

test('writeProp', t => {

    const writeB = writeProp('b')

    const [_, s] = mond.eval(writeB('bar'))

    t.deepEqual(s, {a: 4, b: 'bar'})
});

test('ap', t => {

    const readA = readProp('a')
    const addM = pure(x => y => x + y)

    const mc = addM.ap(readA()).ap(pure(7))

    const v = mond.run(mc)

    t.is(v, 11)
});

