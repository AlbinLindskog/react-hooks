# React hooks

A collection of useful React hooks. Contains:
- useStoredReducer
- useStoredState
- useAsync
- useDelayedAsync
- useDeepCompareMemo
- useDeepCompareEffect
- useDeepCompareCallback
- useOnClickOutside
- useScript
- useCookie


### Install
```bash
npm install --save git+git+https://github.com/AlbinLindskog/react-hooks.git
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

import { useStoredReducer } from 'react-hooks';


const Component = () => {
  const [state, dispatch] = useStoredReducer(someReducer, 0, 'count', (i) => i, window.sessionStorage);
  
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

import { useStoredState } from 'react-hooks';


const Component = () => {
  const [count, setCount] = useStoredState(0, 'count', window.sessionStorage);
  
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

import { useAsync } from 'react-hooks';


const Component = () => {
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

import { useDelayedAsync } from 'react-hooks';


const Component = () => {
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

## useDeepCompareMemo
Equivalent to Reacts useMemo, but relies on deep equality, rather than referential equality. 
This allows you to pass object and arrays, including values that are recreated each re-render, as dependencies.
Like useMemo useDeepCompareMemo caches only the most recent value, not all observed values.

```jsx
import React from 'react';

import { useDeepCompareMemo } from 'react-hooks';


const Component = () => {
  const info = {'name': 'Albin Lindskog'};
  
  const hash = useDeepCompareMemo(() => {
    expensiveHash(info)
  }, [info]);
  
  return (
    <div>{hash}</div>
  );
}
```

## useDeepCompareEffect
Equivalent to Reacts useEffect, but relies on deep equality, rather than referential equality. 
This allows you to pass object and arrays, including values that are recreated each re-render, as dependencies.

```jsx
import React, { useState } from 'react';

import { useDeepCompareEffect } from 'react-hooks';


const Component = () => {
  const options = {step: 2};
  const [step, setStep] = useState(0)
  
  useDeepCompareEffect(() => {
    setStep(options.step);
  }, [options]);
  
  return (
    <div>{step}</div>
  );
}
```

## useDeepCompareCallback
Equivalent to Reacts useCallback, but relies on deep equality, rather than referential equality. 
This allows you to pass object and arrays, including values that are recreated each re-render, as dependencies.

```jsx
import React, { useState } from 'react';

import { useDeepCompareCallback } from 'react-hooks';


const Component = ({options}) => {
  const [value, setValue] = useState(0)
  
  const increment = useDeepCompareCallback(() => {
    setValue(value + options.value);
  }, [options]);
  
  return {value, increment}
}
```

## useOnClickOutside
Allows you to detect and act in response to clicks outside a specified element.

```jsx
import React, { useRef, useCallback } from 'react';

import { useOnClickOutside } from 'react-hooks';


const Component = () => {
  const [show, setShow] = useState(true)
  const ref = useRef()
  const handler = useCallback(() => {
    setShow(false)
  })
  
  useOnClickOutside(ref, handler);
  
  return (
    <div>
      {show ? (
        <div ref={ref}>
          Click outside to close.
        </div>
      ) : (
        <button onClick={() => setShow(true)}>Click to open</button>
      )}
    </div>
  );
}
```

## useScript
Allows you to dynamically load an external script and add onload callbacks.
Useful when you want to interact with an external library and need to wait until the script has loaded before calling
a function declared therein.

The alternative is to include it in the document head for every page request, which would add loading time to your app.

```jsx
import React, { useState } from 'react';

import { useScript } from 'react-hooks';


const Component = () => {
  const [stripe, setStripe] = useState()
  const onLoad = () => setStripe(window.stripe)
  useScript("https://js.stripe.com/v3/", onLoad);
    
  return (
    <StripeProvider stripe={stripe}>
      <CheckoutForm />
    </StripeProvider>
  );
}
```

## useCookie
Allows you to set and access the values of cookies. Note, cookies are
always stored as text, so all values will be strings. 

Set the value ´null´ to delete the cookie.

```jsx
import React from 'react';

import { useCookie } from 'react-hooks';


const Component = () => {
  const [valueCookie, setCookie] = useCookie('no', 'hasAccepted');
    
  return (
    <div>
      {(valueCookie == 'no') ? (
        <button onClick={() => setCookie('yes')}>Click to accept</button>
      ) : (
        <p>You have already accepted!</p>
      )}
    </div>
  );
}
```