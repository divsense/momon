import test from 'ava';
import R from 'ramda';
import {init, mondReadP, mondWriteP, mondReadPropP, mondWritePropP, mondOfP, mondLiftP} from '../index.js'

var mond
const state0 = {a: 4, b: 'foo'}

const delayed = value => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(value)
            }, 1000)
        })
}

const rejection = x => y => Promise.reject('Rejected')

test.beforeEach('init', t => {
    mond = init(state0)
})

test('mondOfP', async t => {
    const x = mondOfP(1)

    const [v,s] = await mond.evalP(x)

    t.truthy(x);
    t.is(v, 1)
    t.deepEqual(s, state0)
});


test('mondLiftP', async t => {
    const mf = mondLiftP(a => a + 1)

    const x = await mond.runP(mf(2))

    t.is(x, 3);
});

test('mondReadP', async t => {
    const mfp = mondReadP(a => state => delayed(a + state.a))

    const x = await mond.runP(mfp(2))

    t.is(x, 6);
});

test('mondWriteP', async t => {
    const mfp = mondWriteP(k => state => delayed(R.over(R.lensProp('a'), R.add(k), state)))

    const [v, s] = await mond.evalP(mfp(2))

    t.truthy(v, 2);
    t.deepEqual(s, {a: 6, b: 'foo'})
});

test('rejected', t => {

    t.plan(1)

    const mfp = mondWriteP(rejection)

    return mond.evalP(mfp(2))
        .then(([v, s]) => { })
        .catch(e => {
            t.is(e, 'Rejected')
        })

});

test('mondReadProp', async t => {

    const readB = mondReadPropP('b')

    const mf = readB(k => state => delayed(R.concat(k, state)))

    const v = await mond.runP(mf('bar'))

    t.is(v, 'barfoo')
});

test('composition-1', async t => {

    const addDelayed = x => y => delayed(x + y)

    const addA = mondReadPropP('a')(addDelayed)

    const add3 = x => mondOfP(x + 3)

    const mc = R.composeK(add3, addA)

    const v = await mond.runP(mc(10))

    t.is(v, 17)
});

test('composition-2', async t => {
    const addDelayed = x => y => delayed(x + y)
    const concatDelayed = x => y => delayed(R.concat(x,y))

    const readAddA = mondReadPropP('a')(addDelayed)

    const toString = x => String(x)

    const writeConcatB = mondWritePropP('b')(concatDelayed)

    const mc = R.composeK(writeConcatB, mondLiftP(toString), readAddA)

    const [v, s] = await mond.evalP(mc(2))

    t.is(v, '6')
    t.is(s.b, '6foo')
});

test('composition-reject', t => {

    t.plan(1)

    const concatDelayed = x => y => delayed(R.concat(x,y))

    const readAddA = mondReadPropP('a')(rejection)
    const toString = mondLiftP(x => String(x))
    const writeConcatB = mondWritePropP('b')(concatDelayed)

    const mc = R.composeK(writeConcatB, toString, readAddA)

    return mond.evalP(mc(2)).then(() => { })
    .catch(e => {
        t.is(e, 'Rejected')
    })

});

test('composition-timing', async t => {
    const addDelayed = x => y => delayed(x + y)
    const concatDelayed = x => y => delayed(R.concat(x,y))

    const readAddA = mondReadPropP('a')(addDelayed)

    const toString = x => String(x)

    const writeConcatB = mondWritePropP('b')(concatDelayed)

    const mc = R.composeK(writeConcatB, mondLiftP(toString), readAddA)

    const [v, s] = await mond.evalP(mc(2))

    t.is(v, '6')
    t.is(s.b, '6foo')
});

