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
        var res = state.run(model);
        var state_ = f(res[0]);
        return state_.run(res[1]);
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

    var model = x;

    const get = State.of;

//    const update = state => state.run( model );

    const run = R.curry(( fn, state ) => {

        const res = (state || State.of({})).run( model );

        model = res[1];

        fn && fn( model );

        return res[0];

    });

    const update = R.curry(( fn, state ) => {

        const res = (state || State.of({})).run( model );

        model = res[1];

        fn && fn( model );

        return get( res[0] );

    });

    return {
		get: get,
        run: run,
		update: update
    }

}

exports.State = State;
exports.Momon = Momon;

