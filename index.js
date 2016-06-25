var R = require( "ramda" );

function State(run){
    if (!(this instanceof State)) {
        return new State(run);
    }
    this.run = run;
}

State.prototype.chain = function(f){
    var state = this;
    return new State(function(model) {
        let [val, model_] = state.run(model);
        let state_ = f(val);
        return state_.run(model_);
    });
}

State.prototype.map = function(f) {
    return this.chain(function(a) {
        return State.of(f(a));
    });
};

State.prototype.of = val => State( model => [val,model] )

State.of = State.prototype.of;

State.read = f => State( model => [ f(model), model ] );

State.write = f => State( model => f(model) );

function Momon( x ){

    let model = x;

    const get = State.of;

    const update = state => state.run( model );

    const updateWith = R.curry(( fn, state ) => {

        const res = (state || State.of({})).run( model );

        model = res[1];

        fn( model );

        return get( res[0] );

    });

    return {
        get,
        update,
        updateWith
    }

}

exports.State = State;
exports.Momon = Momon;

