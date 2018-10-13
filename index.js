const {prop, over, map, set, view, lensProp} = require('ramda')
//
// State Monad
//
function State(run) {
    if(!(this instanceof State)) {
        return new State(run)
    }
    this.run = run
}

State.prototype.chain = function(f){
    var state = this;
    return new State(function(io) {
        var res = state.run(io);
        var state_ = f(res[0]);
        return state_.run(res[1]);
    });
}

State.prototype.map = function(f) {
    return this.chain(function(a) {
        return State.pure(f(a));
    });
};

State.prototype.ap = function(thatState) {
    return this.chain(function(f) {
        return thatState.map(f);
    });
};

State.prototype.pure = val => State( state => [val, state] )

State.pure = State.prototype.pure;

State.read = f => State( state => [ f(state), state ] );

State.write = f => State( state => f(state) );

exports.read = () => State.read(state => state)
exports.readProp = p => () => State.read(state => prop(p, state))

exports.write = value => State.write(state => [value, value])
exports.writeProp = p => value => State.write(state => [value, set(lensProp(p), value, state)])

exports.pure = State.pure
exports.tap = fn => value => {fn(value); return State.pure(value)}
exports.mapM = f => value => State.pure(f(value))

//
// StatePromise Monad
//
function StatePromise(run) {
    if(!(this instanceof StatePromise)) {
        return new StatePromise(run)
    }
    this.run = run
}

StatePromise.prototype.chain = function(fp){
    const spm = this;
    return new StatePromise(async function(state) {
        const [value, _state_] = await spm.run(state)
        const _spm_ = fp(value)
        return _spm_.run(_state_)
    });
}

StatePromise.prototype.map = function(f) {
    return this.chain(function(value) {
        return StatePromise.pure(f(value));
    });
};

StatePromise.prototype.ap = function(thatState) {
    return this.chain(function(f) {
        return thatState.map(f);
    });
};

StatePromise.prototype.pure = val => StatePromise(state => Promise.resolve([val, state]))
StatePromise.prototype.fail = val => StatePromise(_ => Promise.reject(val))

StatePromise.pure = StatePromise.prototype.pure;
StatePromise.fail = StatePromise.prototype.fail;

StatePromise.read = fp => StatePromise(async state => {
    const value = await fp(state)
    return [value, state]
})

StatePromise.write = fp => StatePromise(state => fp(state));

exports.writeP = value => StatePromise.write(_ => Promise.resolve([value, value]))

exports.writePropP = p => value => StatePromise.write(state => Promise.resolve([value, set(lensProp(p), value, state)]))

exports.readP = () => StatePromise.read(state => Promise.resolve(state))
exports.readPropP = p => () => StatePromise.read(state => Promise.resolve(view(lensProp(p), state)))

exports.tapP = fn => value => {fn(value); return StatePromise.pure(value)}
exports.pureP = StatePromise.pure
exports.failP = StatePromise.fail

exports.mapP = fp => value => StatePromise.pure(fp(value))
exports.mapPromise = fp => value => StatePromise(async state => [await fp(value), state]) 
exports.mapPromiseAll = fp => values => StatePromise(state => Promise.all(map(fp, values)).then(xs => [xs, state]))
exports.mapPromiseAny = fp => values => StatePromise(state => Promise.race(map(fp, values)).then(xs => [xs, state]))

//
// init
//
exports.init = function (_state_) {

    var state = Object.assign({}, _state_)

    return {

        run: sm => {
			const [_value_, _state_] = sm.run(state)
			state = _state_
			return _value_
        },

        eval: sm => {
			const x = sm.run(state)
			state = x[1]
			return x
        },

        runP: spm => {
			return spm.run(state)
                    .then(([_value_, _state_]) => {
                        state = _state_
                        return _value_
                    })
        },

        evalP: async spm => {
			const x = await spm.run(state)
            state = x[1]
            return x
        }

    }
}

