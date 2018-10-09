const {prop, over, set, view, lensProp} = require('ramda')
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
        return State.of(f(a));
    });
};

State.prototype.of = val => State( state => [val, state] )

State.of = State.prototype.of;

State.read = f => State( state => [ f(state), state ] );

State.write = f => State( state => f(state) );

exports.mondWrite = fn => value => State.write(state => [value, fn(value)(state)])
exports.mondWriteProp = p => fn => value => State.write(state => [value, over(lensProp(p), fn(value), state)])

exports.mondRead = fn => value => State.read(state => fn(value)(state))
exports.mondReadProp = p => fn => value => State.read(state => fn(value)(prop(p, state)))

exports.mondLift = fn => value => State.of(fn(value))
exports.mondTap = fn => value => {fn(value); return State.of(value)}
exports.mondOf = value => State.of(value)

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
    return this.chain(function(a) {
        return StatePromise.of(f(a));
    });
};

StatePromise.prototype.of = val => StatePromise( state => Promise.resolve([val, state]) )

StatePromise.of = StatePromise.prototype.of;

StatePromise.read = fp => StatePromise(async state => {
    const value = await fp(state)
    return [value, state]
})

StatePromise.write = fp => StatePromise(state => fp(state));

exports.mondWriteP = fp => value => StatePromise.write(async state => {
    const _state_ = await fp(value)(state)
    return [value, _state_]
})

exports.mondWritePropP = p => fp => value => StatePromise.write(async state => {
    const _prop_ = await fp(value)(view(lensProp(p), state))
    return [value, set(lensProp(p), _prop_, state)]
})

exports.mondReadP = fp => value => StatePromise.read(state => fp(value)(state))
exports.mondReadPropP = p => fn => value => StatePromise.read(state => fn(value)(view(lensProp(p), state)))

exports.mondLiftP = fn => value => StatePromise.of(fn(value))

exports.mondTapP = fn => value => {fn(value); return StatePromise.of(value)}
exports.mondOfP = value => StatePromise.of(value)

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

