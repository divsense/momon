import test from 'ava';
import R from 'ramda';
import {init, mondRead, mondWrite, mondReadProp, mondWriteProp, mondOf, mondLift, mondTap} from '../index.js'

var mond
const state0 = {a: 4, b: 'foo'}

test.beforeEach('init', t => {
    mond = init(state0)
})

test('mondOf', t => {
    const x = mondOf(1)

    const [v,s] = mond.eval(x)

    t.truthy(x);
    t.is(v, 1)
    t.deepEqual(s, state0)
});

test('mondLift', t => {
    const mf = mondLift(a => a + 1)

    const x = mond.run(mf(2))

    t.is(x, 3);
});

test('mondRead', t => {
    const mf = mondRead(a => state => a + state.a)

    const x = mond.run(mf(2))

    t.is(x, 6);
});

test('mondWrite', t => {
    const mf = mondWrite(k => R.over(R.lensProp('a'), R.add(k)))

    const [v, s] = mond.eval(mf(2))

    t.is(v, 2);
    t.deepEqual(s, {a: 6, b: 'foo'})
});

test('mondReadProp', t => {

    const readB = mondReadProp('b')

    const mf = readB(k => R.concat(k))

    const v = mond.run(mf('bar'))

    t.is(v, 'barfoo')
});

test('composition-1', t => {

    const addA = mondReadProp('a')(R.add)

    const mc = R.composeK(x => mondOf(x + 3), addA)

    const v = mond.run(mc(10))

    t.is(v, 17)
});

test('composition-2', t => {

    const readAddA = mondReadProp('a')(R.add)
    const toString = mondLift(x => String(x))
    const writeConcatB = mondWriteProp('b')(R.concat)

    const mc = R.composeK(writeConcatB, toString, readAddA)

    const [v, s] = mond.eval(mc(2))

    t.is(v, '6')
    t.is(s.b, '6foo')
});

