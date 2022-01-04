'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _slicedToArray = require('@babel/runtime/helpers/slicedToArray');
var react = require('react');
var dequal = require('dequal');
var Cookies = require('js-cookie');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _slicedToArray__default = /*#__PURE__*/_interopDefaultLegacy(_slicedToArray);
var Cookies__default = /*#__PURE__*/_interopDefaultLegacy(Cookies);

var useStoredReducer = function useStoredReducer(reducer, initialState, storageKey) {
  var init = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function (i) {
    return i;
  };
  var storage = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : window.localStorage;

  /*
  Equivalent to Reacts useReducer, but the state is stored either in the browsers
  localStorage or sessionStorage so it is persisted through a page refresh. It
  accepts an reducer, initial state, an identifying key, optionally an init
  function, and the storage engine to use, which defaults to `window.localStorage`.
  */
  // We pass a custom init function to useReducer, to ensure that we're only reading
  // from storage once, and lazily.
  var _useReducer = react.useReducer(reducer, initialState, function (initialState) {
    // Try to fetch and parse a previously stored state. If it does not exist
    // or can't be retrieved;
    try {
      var item = storage.getItem(storageKey);
      if (item) return JSON.parse(item);
    } catch (error) {
      console.error(error);
    } // Use the provided initialState or init function.


    return init(initialState);
  }),
      _useReducer2 = _slicedToArray__default['default'](_useReducer, 2),
      state = _useReducer2[0],
      dispatch = _useReducer2[1]; // Whenever the state changes, try to persist it to storage


  react.useEffect(function () {
    try {
      storage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error(error);
    }
  }, [state]);
  return [state, dispatch];
};
var useStoredState = function useStoredState(initialValue, storageKey) {
  var storage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : window.localStorage;

  /*
  Equivalent to Reacts useState, but the state is stored either in the browsers
  localStorage or sessionStorage so it is persisted through a page refresh. It
  accepts an initial value, an identifying key, and the storage engine to use,
  which defaults to `window.localStorage`.
  */
  // useState is implemented internally in React from useReducer, so why not do
  // the same? By building it from useStoredReducer rather then by wrapping
  // useState we can reduce all the logic around storing and fetching from
  // storage.
  // useState is simply a useReducer with a reducer that simply replaces the
  // last state, however the new state can be provided either as a value or
  // as a function.
  var reducer = function reducer(prevState, newState) {
    return typeof newState === 'function' ? newState(prevState) : newState;
  }; // Likewise can the initial value be provided either as a value or as a function.


  var init = function init(initialValue) {
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  };

  return useStoredReducer(reducer, initialValue, storageKey, init, storage);
};
var useDelayedAsync = function useDelayedAsync(asyncFunction) {
  /*
  Wraps an async function, allowing it to be used directly in a React component.
  It returns the same three values, `result`, `error`, `loading`, along with an
  `execute` method allowing you to control when the function starts executing.
   */
  var _useState = react.useState(false),
      _useState2 = _slicedToArray__default['default'](_useState, 2),
      loading = _useState2[0],
      setLoading = _useState2[1];

  var _useState3 = react.useState(null),
      _useState4 = _slicedToArray__default['default'](_useState3, 2),
      result = _useState4[0],
      setResult = _useState4[1];

  var _useState5 = react.useState(null),
      _useState6 = _slicedToArray__default['default'](_useState5, 2),
      error = _useState6[0],
      setError = _useState6[1]; // The execute function is wrapped in a useCallback to ensure that it can be
  // used as a dependency to useEffect, without it being called on every re-render.


  var execute = react.useCallback(function () {
    setLoading(true);
    setResult(null);
    setError(null);
    return asyncFunction().then(function (response) {
      setResult(response);
      setLoading(false);
    })["catch"](function (error) {
      setError(error);
      setLoading(false);
    });
  }, [asyncFunction]);
  return {
    result: result,
    error: error,
    loading: loading,
    execute: execute
  };
};
var useAsync = function useAsync(asyncFunction) {
  /*
  Wraps an async function, allowing it to be used directly in a React component.
  It returns three values, `result`, `error` and `loading`, allowing you to track
  the state of the async call and change your component accordingly.
   */
  var _useDelayedAsync = useDelayedAsync(asyncFunction),
      result = _useDelayedAsync.result,
      error = _useDelayedAsync.error,
      loading = _useDelayedAsync.loading,
      execute = _useDelayedAsync.execute;

  react.useEffect(function () {
    execute();
  }, []);
  return {
    result: result,
    error: error,
    loading: loading
  };
};
var useDeepCompareMemo = function useDeepCompareMemo(func, dependencies) {
  /*
  Equivalent to Reacts useMemo, but relies on deep equality, rather than
  referential equality. This allows you to pass object and arrays, including values that
  are recreated each re-render, as dependencies.
   Like useMemo useDeepCompareMemo caches only the most recent value, not all
  observed values.
   */
  var ref = react.useRef({});

  if (!ref.current || !dequal.dequal(dependencies, ref.current.key)) {
    ref.current = {
      key: dependencies,
      value: func()
    };
  }

  return ref.current.value;
};
var useDeepCompareEffect = function useDeepCompareEffect(callBack, dependencies) {
  /*
  Equivalent to Reacts useEffect, but relies on deep equality, rather than
  referential equality. This allows you to pass object and arrays, including values that
  are recreated each re-render, as dependencies.
   */
  react.useEffect(callBack, useDeepCompareMemo(function () {
    return dependencies;
  }, dependencies));
};
var useDeepCompareCallback = function useDeepCompareCallback(callBack, dependencies) {
  /*
  Equivalent to Reacts useCallback, but relies on deep equality, rather than
  referential equality. This allows you to pass object and arrays, including values that
  are recreated each re-render, as dependencies.
   */
  return react.useCallback(callBack, useDeepCompareMemo(function () {
    return dependencies;
  }, dependencies));
};
var useOnClickOutSide = function useOnClickOutSide(ref, handler) {
  /*
  Allows you to detect and act in response to clicks outside a specified element.
  */
  // Create a ref that stores handler. That way if the handler changes, (e.g.
  // because it was defined inline in a functional component that re-rendered)
  // only this useEffect hook runs, instead of the one manages the
  // eventListeners and has some overhead. The correct way is to wrap handler
  // in useCallback before passing it to useOnClickOutside, but that requires
  // the user to have insight into the implementation of this hook.
  var savedHandler = react.useRef();
  react.useEffect(function () {
    savedHandler.current = handler;
  }, [handler]);
  react.useEffect(function () {
    var listener = function listener(event) {
      // Do nothing if clicking the ref's or it's children elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      } // Call the latest version of the handler, stored in the ref.


      savedHandler.current(event);
    };

    document.addEventListener("onClick", listener, {
      capture: true
    });
    return function () {
      document.removeEventListener("onClick", listener, {
        capture: true
      });
    };
  }, [ref]);
};
var useScript = function useScript(source) {
  var onLoad = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};
  var onError = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};

  /*
  Allows you to dynamically load an external script and add onload callbacks.
  Useful when you want to interact with an external library and need to wait
  until the script has loaded before calling a function declared therein.
   The alternative is to include it in the document head for every page request,
  which would add loading time to your app.
  */
  // Create refs that stores the callbacks. That way if they change, (e.g.
  // because they were defined inline in a functional component that re-rendered)
  // only this useEffect hook runs, instead of the one manages the
  // eventListeners and has some overhead. The correct way is to wrap the
  // callbacks in useCallback before passing it to useOnClickOutside, but that
  // requires the user to have insight into the implementation of this hook.
  var savedOnLoad = react.useRef();
  var savedOnError = react.useRef();
  react.useEffect(function () {
    savedOnLoad.current = onLoad;
    savedOnError.current = onError;
  }, [onLoad, onError]);
  react.useEffect(function () {
    // Allows you to pass null as source, in case you want to conditionally
    // load the script.
    if (!source) {
      return;
    }

    var script = document.createElement("script");
    script.src = source;
    script.async = true;
    document.body.appendChild(script);

    var onLoad = function onLoad(event) {
      // Call the latest version of the handler, stored in the ref.
      savedOnLoad.current(event);
    };

    var onError = function onError(event) {
      // Call the latest version of the handler, stored in the ref.
      savedOnError.current(event);
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    return function () {
      if (script) {
        script.removeEventListener("load", onLoad);
        script.removeEventListener("error", onError);
      }
    };
  }, [source]);
  return status;
};
var useCookie = function useCookie(initial, cookieName) {
  /*
  Allows you to set and access the values of cookies. Note, cookies are
  always stored as text, so all values will be strings.
   Set the value ´null´ to delete the cookie.
  */
  // If the cookie already exists, use that as initial value, else
  // the provided one.
  var _useState7 = react.useState(function () {
    // Cookies are always stored as string, so we cast the value to
    // a string before calling setValue so it's always consistent,
    // whether you get the provided value back or a value stored in
    // a cookie.
    return Cookies__default['default'].get(cookieName) || String(initial);
  }),
      _useState8 = _slicedToArray__default['default'](_useState7, 2),
      value = _useState8[0],
      setValue = _useState8[1]; //See the js-cookie library for what attributes are allowed to be passed
  //as coookie  options.


  var updateCookie = react.useCallback(function (value, options) {
    if (value === null) {
      setValue(value);
      Cookies__default['default'].remove(cookieName);
    } else {
      setValue(String(value));
      Cookies__default['default'].set(cookieName, value, options);
    }
  }, [cookieName]);
  return [value, updateCookie];
};

exports.useAsync = useAsync;
exports.useCookie = useCookie;
exports.useDeepCompareCallback = useDeepCompareCallback;
exports.useDeepCompareEffect = useDeepCompareEffect;
exports.useDeepCompareMemo = useDeepCompareMemo;
exports.useDelayedAsync = useDelayedAsync;
exports.useOnClickOutSide = useOnClickOutSide;
exports.useScript = useScript;
exports.useStoredReducer = useStoredReducer;
exports.useStoredState = useStoredState;
