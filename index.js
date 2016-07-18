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

function Mond( x ){

    var model = x;

    var begin = State.of;

    var end = state => {
        var res = state.run( model );
        model = res[1];
        return res[0];
    };

    var update = R.curry(( fn, state ) => {
        var res = (state || State.of({})).run( model );
        model = res[1];
        fn( model );
        return begin( res[0] );
    });

    var tap = R.curry((fn, state) => R.chain(val => State.read(model => {fn(model,val);return val}), state));
    var read = R.curry((fn, state) => R.chain(val => State.read(model => fn(val, model)), state));
    var write = R.curry((fn, state) => R.chain(val => State.write(model => [val, fn(val, model)]), state));

    return {
		begin: begin,
        read: read,
        write: write,
		update: update,
		tap: tap,
        end: end,
    }

}

exports.State = State;
exports.Mond = Mond;

