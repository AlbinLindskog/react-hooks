import { renderHook, act } from '@testing-library/react-hooks'
import { useAsync, useDelayedAsync, useStoredReducer, useStoredState } from './index.js'


const  testReducer = (state, action) => {
  switch (action.type) {
    case 'increment':
      return {count: state.count + 1};
    case 'decrement':
      return {count: state.count - 1};
    default:
      throw new Error();
  }
};


test('useReducer with storage', () => {
  const { result } = renderHook(() => useStoredReducer(testReducer,{count: 0}, 'count_1'));

  // Check initial value:
  expect(result.current[0]).toStrictEqual({count: 0});
  // Check stored value:
  expect(window.localStorage.getItem('count_1')).toStrictEqual("{\"count\":0}");  // Stored as json in localstorage

  // Dispatch an action
  act(() => {
    result.current[1]({type: 'increment'})
  });

  // And check value again:
  expect(result.current[0]).toStrictEqual({count: 1});
  // Check stored value:
  expect(window.localStorage.getItem('count_1')).toStrictEqual("{\"count\":1}");  // Stored as json in localstorage

  // Emulate refresh of the page
  const { result: refreshed_result } = renderHook(() => useStoredReducer(testReducer,{count: 0}, 'count_1'));

  // The initial value should now be the stored one.
  expect(refreshed_result.current[0]).toStrictEqual({count: 1});
  // And the stored value should not be changed:
  expect(window.localStorage.getItem('count_1')).toStrictEqual("{\"count\":1}");  // Stored as json in localstorage
});


test('useReducer with broken storage', () => {
  let { result } = renderHook(() => useStoredReducer(testReducer, {count: 0}, 'count_2', (i) => (i), Object));

  // Check initial value:
  expect(result.current[0]).toStrictEqual({count: 0});

  // Dispatch an action
  act(() => {
    result.current[1]({type: 'increment'})
  });

  // And check value again:
  expect(result.current[0]).toStrictEqual({count: 1});

  // Emulate refresh of the page
  const { result: refreshed_result } = renderHook(() => useStoredReducer(testReducer, {count: 0}, 'count_2', (i) => (i), Object));

  // The initial value should the provided initialValue:
  expect(refreshed_result.current[0]).toStrictEqual({count: 0});
});


test('useReducer alternative call signatures', () => {
  const { result } = renderHook(() => useStoredReducer(testReducer,0, 'count_3', (i) => ({count: i+2})));

  // Check initial value:
  expect(result.current[0]).toStrictEqual({count: 2});
  // Check stored value:
  expect(window.localStorage.getItem('count_3')).toStrictEqual("{\"count\":2}");  // Stored as json in localstorage

  // Dispatch an action
  act(() => {
    result.current[1]({type: 'increment'})
  });

  // And check value again:
  expect(result.current[0]).toStrictEqual({count: 3});
  // Check stored value:
  expect(window.localStorage.getItem('count_3')).toStrictEqual("{\"count\":3}");  // Stored as json in localstorage

});


test('useStoredState signatures', () => {
  const { result } = renderHook(() => useStoredState(0, 'count_4', ));

  // Check initial value:
  expect(result.current[0]).toBe(0);

  // Update state
  act(() => {
    result.current[1](1)
  });

  // And check value again:
  expect(result.current[0]).toBe(1);
});


test('useStoredState alternative call signatures', () => {
  const { result } = renderHook(() => useStoredState(() => 0, 'count_5', ));

  // Check initial value:
  expect(result.current[0]).toBe(0);

  // Update state
  act(() => {
    result.current[1](() => 1)
  });

  // And check value again:
  expect(result.current[0]).toBe(1);
});



test('useDelayedAsync resolves correctly', async () => {
  const asyncResolve = async () => Promise.resolve('Ok!');

  const { result, waitForNextUpdate } = renderHook(() => useDelayedAsync(asyncResolve));

  // Check the initial values:
  expect(result.current.result).toBe(null);
  expect(result.current.error).toBe(null);
  expect(result.current.loading).toBe(false);

  // Start execution:
  // Wrapping execute in act() is not necesarry since it's async, according to the documentation:
  // https://react-hooks-testing-library.com/usage/advanced-hooks#async still raises a warning, though.
  result.current.execute();

  // Check the values
  expect(result.current.result).toBe(null);
  expect(result.current.error).toBe(null);
  expect(result.current.loading).toBe(true);

  // Wait for asyncResolve to resolve:
  await waitForNextUpdate();

  // Check the values once again:
  expect(result.current.result).toBe('Ok!');
  expect(result.current.error).toBe(null);
  expect(result.current.loading).toBe(false);
});


test('useDelayedAsync with error', async () => {
  const asyncReject = async () => Promise.reject('No!');

  const { result, waitForNextUpdate } = renderHook(() => useDelayedAsync(asyncReject));

  // Check the initial values:
  expect(result.current.result).toBe(null);
  expect(result.current.error).toBe(null);
  expect(result.current.loading).toBe(false);

  // Start execution:
  // Wrapping execute in act() is not necesarry since it's async, according to the documentation:
  // https://react-hooks-testing-library.com/usage/advanced-hooks#async still raises a warning, though.
  result.current.execute();

  // Check the values
  expect(result.current.result).toBe(null);
  expect(result.current.error).toBe(null);
  expect(result.current.loading).toBe(true);

  // Wait for asyncReject to reject:
  await waitForNextUpdate();

  // Check the values once again:
  expect(result.current.result).toBe(null);
  expect(result.current.error).toBe('No!');
  expect(result.current.loading).toBe(false);
});


test('useAsync resolves correctly', async () => {
  const asyncResolve = async () => Promise.resolve('Ok!');

  const { result, waitForNextUpdate } = renderHook(() => useAsync(asyncResolve));

  // Check the initial values:
  expect(result.current.result).toBe(null);
  expect(result.current.error).toBe(null);
  expect(result.current.loading).toBe(true);

  // Wait for asyncResolve to resolve:
  await waitForNextUpdate();

  // Check the values once again:
  expect(result.current.result).toBe('Ok!');
  expect(result.current.error).toBe(null);
  expect(result.current.loading).toBe(false);
});


test('useAsync with error', async () => {
  const asyncReject = async () => Promise.reject('No!');

  const { result, waitForNextUpdate } = renderHook(() => useAsync(asyncReject));

  // Check the initial values:
  expect(result.current.result).toBe(null);
  expect(result.current.error).toBe(null);
  expect(result.current.loading).toBe(true);

  // Wait for asyncReject to reject:
  await waitForNextUpdate();

  // Check the values once again:
  expect(result.current.result).toBe(null);
  expect(result.current.error).toBe('No!');
  expect(result.current.loading).toBe(false);
});


