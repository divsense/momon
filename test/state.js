import test from 'ava';
import R from 'ramda';
import {init, read, write, readProp, writeProp, of, lift, mondTap} from '../index.js'

var mond
const state0 = {a: 4, b: 'foo'}

test.beforeEach('init', t => {
    mond = init(state0)
})

test('of', t => {
    const x = of(1)

    const [v,s] = mond.eval(x)

    t.truthy(x);
    t.is(v, 1)
    t.deepEqual(s, state0)
});

test('lift', t => {
    const mf = lift(a => a + 1)

    const x = mond.run(mf(2))

    t.is(x, 3);
});

test('read', t => {
    const mf = read(a => state => a + state.a)

    const x = mond.run(mf(2))

    t.is(x, 6);
});

test('write', t => {
    const mf = write(k => R.over(R.lensProp('a'), R.add(k)))

    const [v, s] = mond.eval(mf(2))

    t.is(v, 2);
    t.deepEqual(s, {a: 6, b: 'foo'})
});

test('readProp', t => {

    const readB = readProp('b')

    const mf = readB(k => R.concat(k))

    const v = mond.run(mf('bar'))

    t.is(v, 'barfoo')
});

test('composition-1', t => {

    const addA = readProp('a')(R.add)

    const mc = R.composeK(x => of(x + 3), addA)

    const v = mond.run(mc(10))

    t.is(v, 17)
});

test('composition-2', t => {

    const readAddA = readProp('a')(R.add)
    const toString = lift(x => String(x))
    const writeConcatB = writeProp('b')(R.concat)

    const mc = R.composeK(writeConcatB, toString, readAddA)

    const [v, s] = mond.eval(mc(2))

    t.is(v, '6')
    t.is(s.b, '6foo')
});

