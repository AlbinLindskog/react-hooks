import { useCallback, useEffect, useReducer, useState } from 'react';


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
    execute()
  }, []);

  return { result, error, loading };
};