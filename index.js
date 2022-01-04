import { useCallback, useEffect, useReducer, useState, useRef } from 'react';

import { dequal } from 'dequal';
import Cookies from 'js-cookie';


export const useStoredReducer = (
  reducer, initialState, storageKey, init=(i) => (i), storage=window.localStorage
) => {
  /*
  Equivalent to Reacts useReducer, but the state is stored either in the browsers
  localStorage or sessionStorage so it is persisted through a page refresh. It
  accepts an reducer, initial state, an identifying key, optionally an init
  function, and the storage engine to use, which defaults to `window.localStorage`.
  */

  // We pass a custom init function to useReducer, to ensure that we're only reading
  // from storage once, and lazily.
  const [state, dispatch] = useReducer(reducer, initialState, (initialState) => {
    // Try to fetch and parse a previously stored state. If it does not exist
    // or can't be retrieved;
    try {
      const item = storage.getItem(storageKey);
      if (item) return JSON.parse(item);
    } catch (error) {
      console.error(error);
    }
    // Use the provided initialState or init function.
    return init(initialState);
  });

  // Whenever the state changes, try to persist it to storage
  useEffect(() => {
    try {
      storage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error(error);
    }
  }, [state]);

  return [state, dispatch];
};


export const useStoredState = (
  initialValue, storageKey, storage=window.localStorage
) => {
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
  const reducer = (prevState, newState) => {
    return typeof newState === 'function' ? newState(prevState) : newState;
  };

  // Likewise can the initial value be provided either as a value or as a function.
  const init = (initialValue) => {
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  };

  return useStoredReducer(
    reducer,
    initialValue,
    storageKey,
    init,
    storage
  );
};


export const useDelayedAsync = (asyncFunction) => {
  /*
  Wraps an async function, allowing it to be used directly in a React component.
  It returns the same three values, `result`, `error`, `loading`, along with an
  `execute` method allowing you to control when the function starts executing.
   */
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // The execute function is wrapped in a useCallback to ensure that it can be
  // used as a dependency to useEffect, without it being called on every re-render.
  const execute = useCallback(() => {
    setLoading(true);
    setResult(null);
    setError(null);

    return asyncFunction()
      .then(response => {
        setResult(response);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });

  }, [asyncFunction]);

  return { result, error, loading, execute };
};


export const useAsync = (asyncFunction) => {
  /*
  Wraps an async function, allowing it to be used directly in a React component.
  It returns three values, `result`, `error` and `loading`, allowing you to track
  the state of the async call and change your component accordingly.
   */
  const { result, error, loading, execute } = useDelayedAsync(asyncFunction);

  useEffect(() => {
    execute();
  }, []);

  return { result, error, loading };
};


export const useDeepCompareMemo = (func, dependencies) => {
  /*
  Equivalent to Reacts useMemo, but relies on deep equality, rather than
  referential equality. This allows you to pass object and arrays, including values that
  are recreated each re-render, as dependencies.

  Like useMemo useDeepCompareMemo caches only the most recent value, not all
  observed values.
   */
  const ref = useRef({})

  if (!ref.current || !dequal(dependencies, ref.current.key)) {
    ref.current = {key: dependencies, value: func()};
  }

  return ref.current.value
}


export const useDeepCompareEffect = (callBack, dependencies) => {
  /*
  Equivalent to Reacts useEffect, but relies on deep equality, rather than
  referential equality. This allows you to pass object and arrays, including values that
  are recreated each re-render, as dependencies.
   */
  useEffect(callBack, useDeepCompareMemo(() => dependencies, dependencies))
}


export const useDeepCompareCallback= (callBack, dependencies) => {
  /*
  Equivalent to Reacts useCallback, but relies on deep equality, rather than
  referential equality. This allows you to pass object and arrays, including values that
  are recreated each re-render, as dependencies.
   */
  return useCallback(callBack, useDeepCompareMemo(() => dependencies, dependencies))
}


export const useOnClickOutSide = (ref, handler) => {
  /*
  Allows you to detect and act in response to clicks outside a specified element.
  */

  // Create a ref that stores handler. That way if the handler changes, (e.g.
  // because it was defined inline in a functional component that re-rendered)
  // only this useEffect hook runs, instead of the one manages the
  // eventListeners and has some overhead. The correct way is to wrap handler
  // in useCallback before passing it to useOnClickOutside, but that requires
  // the user to have insight into the implementation of this hook.
  const savedHandler = useRef();
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (event) => {
      // Do nothing if clicking the ref's or it's children elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      // Call the latest version of the handler, stored in the ref.
      savedHandler.current(event);
    }

    document.addEventListener("onClick", listener, {capture: true});
    return () => {
      document.removeEventListener("onClick", listener, {capture: true});
    }
  }, [ref]);
}


export const useScript = (source, onLoad = () => {},  onError = () => {}) => {
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
  const savedOnLoad = useRef();
  const savedOnError = useRef();
  useEffect(() => {
    savedOnLoad.current = onLoad;
    savedOnError.current = onError;
  }, [onLoad, onError]);


  useEffect(() => {
      // Allows you to pass null as source, in case you want to conditionally
      // load the script.
      if (!source) {
        return;
      }

      const script = document.createElement("script");
      script.src = source;
      script.async = true;
      document.body.appendChild(script);

      const onLoad = (event) => {
        // Call the latest version of the handler, stored in the ref.
        savedOnLoad.current(event);
      }

      const onError = (event) => {
        // Call the latest version of the handler, stored in the ref.
        savedOnError.current(event);
      }

      script.addEventListener("load", onLoad);
      script.addEventListener("error", onError);

      return () => {
        if (script) {
          script.removeEventListener("load", onLoad);
          script.removeEventListener("error", onError);
        }
      };
    },
    [source]
  );

  return status;
}


export const useCookie = (initial, cookieName) => {
  /*
  Allows you to set and access the values of cookies. Note, cookies are
  always stored as text, so all values will be strings.

  Set the value ´null´ to delete the cookie.
  */

  // If the cookie already exists, use that as initial value, else
  // the provided one.
  const [value, setValue] = useState(() => {
      // Cookies are always stored as string, so we cast the value to
      // a string before calling setValue so it's always consistent,
      // whether you get the provided value back or a value stored in
      // a cookie.
      return Cookies.get(cookieName) || String(initial)
  });

  //See the js-cookie library for what attributes are allowed to be passed
  //as coookie  options.
  const updateCookie = useCallback((value, options) => {
      if (value === null) {
          setValue(value);
          Cookies.remove(cookieName);
      } else {
          setValue(String(value));
          Cookies.set(cookieName, value, options);
      }
    },
    [cookieName]
  );

  return [value, updateCookie];
};
