# React hooks

A collection of useful React hooks. Contains:
- useStoredReducer
- useStoredState
- useAsync
- useDelayedAsync


### Install
```bash
npm install --save git+git+https://github.com/AlbinLindskog/reactHooks.git
```

### Testing
Run all tests:
```bash
npm test
```
Run a specific tests:
```bash
npm test -- -t 'the tests description string'
```

## useStoredReducer
Equivalent to Reacts useReducer, but the state is stored either in the browsers localStorage or sessionStorage so it 
is persisted through a page refresh. It accepts an reducer, initial state, an identifying key, optionally an init 
function, and the storage engine to use, which defaults to `window.localStorage`.
```jsx
import React from 'react';

import { useStoredReducer } from 'reactHooks';


const Component () => {
  const [state, dispatch] = useStoredReducer(someReducer, 0, 'count', storage=window.sessionStorage);
  return (
    <div>
      The count is: {state.count}
      <button onClick={() => dispatch({type: 'decrement'})}>-</button>
      <button onClick={() => dispatch({type: 'increment'})}>+</button>
    </div>
  );
}
```

## useStoredState
Equivalent to Reacts useState, but the state is stored either in the browsers localStorage or sessionStorage so it 
is persisted through a page refresh. It accepts an initial value, an identifying key, and the storage engine to use, which
defaults to `window.localStorage`.
```jsx
import React from 'react';

import { useStoredState } from 'reactHooks';


const Component () => {
  const [count, setCount] = useStoredState(0, 'count', storage=window.sessionStorage);
  return (
    <div>
      <div>
        The count is: {count}
        <button onClick={() => setCount(count - 1)}>-</button>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
    </div>
  );
}
```

## useAsync
Wraps an async function, allowing it to be used directly in a React component.
It returns three values, `result`, `error` and `loading`, allowing you to track the state of the async call and change 
your component accordingly.

```jsx
import React from 'react';

import { useAsync } from 'reactHooks';


const Component () => {
  const { result, error, loading } = useAsync(someAsyncFunc);
  return (
    <div>
      {loading && <div>Loading!</div>}
      {result && <div>{result}</div>}
      {error && <div>{error}</div>}
    </div>
  );
}
```

## useDelayedAsync
Wraps an async function, allowing it to be used directly in a React component.
It returns the same three values, `result`, `error`, `loading`, along with an `execute` method allowing you to control
when the function starts executing.

```jsx
import React from 'react';

import { useDelayedAsync } from 'reactHooks';


const Component () => {
  const { result, error, loading, execute } = useDelayedAsync(someAsyncFunc);
  return (
    <div>
      {(!loading || !result || !error) && <div>Click the button!</div>}
      {result && <div>{result}</div>}
      {error && <div>{error}</div>}
      <button onClick={execute} disabled={loading}>
        {loading ? 'Loading...' : 'Click me!'}
      </button>
    </div>
  );
}
```