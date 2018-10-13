import test from 'ava';
import R from 'ramda';
import {init, readP, writeP, readPropP, writePropP, pureP, mapP, mapPromise, mapPromiseAll} from '../index.js'

var mond
const state0 = {a: 4, b: 'foo'}

const delayed = value => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(value)
            }, 1000)
        })
}

const rejection = () => Promise.reject('Rejected')

test.beforeEach('init', t => {
    mond = init(state0)
})

test('pure', async t => {
    const x = pureP(1)

    const [v,s] = await mond.evalP(x)

    t.truthy(x);
    t.is(v, 1)
    t.deepEqual(s, state0)
});


test('read', async t => {

    const x = await mond.runP(readP())

    t.deepEqual(x, state0);
});

test('write', async t => {
    const [v, s] = await mond.evalP(writeP({a:6,b:'foo'}))

    t.deepEqual(s, {a: 6, b: 'foo'})
});

test('map', async t => {
    const mf = R.composeK(mapP(a => a + 1), pureP)

    const x = await mond.runP(mf(2))

    t.is(x, 3);
});

test('map promise', async t => {
    const mf = R.composeK(mapPromise(delayed), pureP)

    const x = await mond.runP(mf(2))

    t.is(x, 2);
});

test('map promise all', async t => {
    const mf = R.composeK(mapPromiseAll(delayed), pureP)

    const x = await mond.runP(mf([2,3]))

    t.deepEqual(x, [2,3]);
});

test('rejected', t => {

    t.plan(1)

    const mfp = R.composeK(writeP, mapPromise(rejection))

    return mond.evalP(mfp(2))
        .then(([v, s]) => { })
        .catch(e => {
            t.is(e, 'Rejected')
        })

});

test('readProp', async t => {

    const readB = readPropP('b')

    const v = await mond.runP(readB())

    t.is(v, 'foo')
});

test('ap', async t => {

    const readA = readPropP('a')
    const addM = pureP(x => y => x + y)

    const mc = addM.ap(readA()).ap(pureP(7))

    const v = await mond.runP(mc)

    t.is(v, 11)
});

