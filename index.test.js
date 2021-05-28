import Cookies from 'js-cookie';

import { renderHook, act } from '@testing-library/react-hooks'

import {
  useAsync, useDelayedAsync, useStoredReducer, useStoredState,
  useDeepCompareMemo, useDeepCompareEffect, useOnClickOutSide,
  useScript, useCookie
} from './index.js'


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
  const { result, rerender } = renderHook(() => useStoredReducer(testReducer,{count: 0}, 'count_1'));

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

  // Should not be changed by re-render:
  rerender()
  expect(result.current[0]).toStrictEqual({count: 1});

  // Emulate refresh of the page
  const { result: refreshed_result } = renderHook(() => useStoredReducer(testReducer,{count: 0}, 'count_1'));

  // The initial value should now be the stored one.
  expect(refreshed_result.current[0]).toStrictEqual({count: 1});
  // And the stored value should not be changed:
  expect(window.localStorage.getItem('count_1')).toStrictEqual("{\"count\":1}");  // Stored as json in localstorage
});


test('useReducer with broken storage', () => {
  let { result, rerender } = renderHook(() => useStoredReducer(testReducer, {count: 0}, 'count_2', (i) => i, Object));

  // Check initial value:
  expect(result.current[0]).toStrictEqual({count: 0});

  // Dispatch an action
  act(() => {
    result.current[1]({type: 'increment'})
  });

  // And check value again:
  expect(result.current[0]).toStrictEqual({count: 1});

  // Should not be changed by re-render:
  rerender()
  expect(result.current[0]).toStrictEqual({count: 1});

  // Emulate refresh of the page
  const { result: refreshed_result } = renderHook(() => useStoredReducer(testReducer, {count: 0}, 'count_2', (i) => i, Object));

  // The initial value should the provided initialValue, since storage is broken:
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


test('useDeepCompareMemo with object', () => {
  const func = jest.fn()

  let dependencies = {a: 'b'}
  const { rerender } = renderHook(() => useDeepCompareMemo(func, [dependencies]));

  // Should be called on first render
  expect(func).toHaveBeenCalledTimes(1);

  // Should not be called again on re-renders
  rerender();
  expect(func).toHaveBeenCalledTimes(1);

  // Should not not be called when dependencies are changed to a new object with same properties.
  dependencies = {a: 'b'}
  rerender();
  expect(func).toHaveBeenCalledTimes(1);

  // Should be called when dependencies are changed to a new object with different properties.
  dependencies = {a: 'c'}
  rerender();
  expect(func).toHaveBeenCalledTimes(2);
});


test('useDeepCompareEffect with object', () => {
  const callback = jest.fn()

  let dependencies = {a: 'b'}
  const { rerender } = renderHook(() => useDeepCompareEffect(callback, [dependencies]));

  // Should be called on first render
  expect(callback).toHaveBeenCalledTimes(1);

  // Should not be called again on re-renders
  rerender();
  expect(callback).toHaveBeenCalledTimes(1);

  // Should not not be called when dependencies are changed to a new object with same properties.
  dependencies = {a: 'b'}
  rerender();
  expect(callback).toHaveBeenCalledTimes(1);

  // Should be called when dependencies are changed to a new object with different properties.
  dependencies = {a: 'c'}
  rerender();
  expect(callback).toHaveBeenCalledTimes(2);
});


test('useDeepCompareEffect cleanup', () => {
  const cleanup = jest.fn()

  let dependencies = {a: 'b'}
  const { rerender, unmount } = renderHook(() => useDeepCompareEffect(() => cleanup, [dependencies]));

  // Should not be called first render
  expect(cleanup).not.toHaveBeenCalled();

  // Should not be called again on re-renders
  rerender();
  expect(cleanup).not.toHaveBeenCalled();

  // Should run cleanup on unmount
  unmount()
  expect(cleanup).toHaveBeenCalledTimes(1);
});


test('useOnClickOutSide event setup and cleaning', () => {
  // Set up our own mock event handling for the testing
  const map = {};
  document.addEventListener = jest.fn((event, listener) => {
    map[event] = listener;
  });
  document.removeEventListener = jest.fn((event, listener) => {
    delete map[event];
  });

  // Defined outside of the hook so we can reference them in the expect.
  const handler = jest.fn()
  const ref = {current: {}}

  // Event listener should be setup
  const { rerender, unmount } = renderHook(() => useOnClickOutSide(ref, handler));
  expect(Object.keys(map)).toHaveLength(1)

  // Event listener should be removed on unmount
  unmount()
  expect(Object.keys(map)).toHaveLength(0)
});


test('useOnClickOutSide event handling', () => {
  // Set up our own mock event handling for the testing
  const map = {};
  document.addEventListener = jest.fn((event, listener) => {
    map[event] = listener;
  });

  const handler = jest.fn()
  const ref = {current: {contains: () => false}}
  const { rerender, unmount } = renderHook(() => useOnClickOutSide(ref, handler));

  // Fire fake event
  map.onClick({target: 'some-element'})
  expect(handler).toHaveBeenCalledTimes(1);

});


test('useScript element created', () => {
  const { result } = renderHook(() => useScript('test-script.com'));

  const script = document.querySelector('script');
  expect(script).not.toBeNull();
  expect(script.getAttribute('src')).toEqual('test-script.com');
});


test('useScript event setup and cleaning', () => {
  // Set up our own mock event handling for the testing
  const map = {};
  const script = document.createElement("script")
  script.addEventListener = jest.fn((event, listener) => {
    map[event] = listener;
  })
  script.removeEventListener = jest.fn((event, listener) => {
    delete map[event];
  })
  document.createElement = jest.fn((element) => {
    return script
  })


  // Event listener should be setup
  const { rerender, unmount } = renderHook(() => useScript('test-script.com'));
  expect(Object.keys(map)).toHaveLength(2)

  // Event listener should be removed on unmount
  unmount()
  expect(Object.keys(map)).toHaveLength(0)
});


test('useScript event handling', () => {
  // Set up our own mock event handling for the testing
  const map = {};
  const script = document.createElement("script")
  script.addEventListener = jest.fn((event, listener) => {
    map[event] = listener;
  })
  script.removeEventListener = jest.fn((event, listener) => {
    delete map[event];
  })
  document.createElement = jest.fn((element) => {
    return script
  })

  const onLoad = jest.fn()
  const onError = jest.fn()
  const { rerender, unmount } = renderHook(() => useScript('test-script.com', onLoad, onError));

  // Fire fake event
  map.load({})
  expect(onLoad).toHaveBeenCalledTimes(1);

  // Fire fake event
  map.error({})
  expect(onError).toHaveBeenCalledTimes(1);
});


test('useCookie initial value', () => {
  // Initial value should be the provided inital value if the cookie does not exist.
  const {result} = renderHook(() => useCookie(0, 'testCookie'));
  expect(result.current[0]).toBe(0);

  // Initial value should be the value of the cookie, if it already exists.
  Cookies.set('testCookie2', 2);
  const {result: newResult} = renderHook(() => useCookie(0, 'testCookie2'));
  expect(newResult.current[0]).toBe('2');
});


test('useCookie cookie handling', () => {
  const { result } = renderHook(() => useCookie(0, 'testCookie3'));
  const spySet = jest.spyOn(Cookies, 'set');
  const spyRemove = jest.spyOn(Cookies, 'remove')

  // Calling update should update both the value and the cookie
  act(() => {
    result.current[1](3);
  });
  expect(result.current[0]).toBe(3);
  expect(spySet).toHaveBeenCalledTimes(1);
  expect(spySet).toHaveBeenCalledWith('testCookie3', 3, undefined);

  // Deleting the cookie should set the value to null and delete the cookis;
  act(() => {
    result.current[1](null);
  });
  expect(result.current[0]).toBe(null);
  expect(spyRemove).toHaveBeenCalledTimes(1);
  expect(spyRemove).toHaveBeenCalledWith('testCookie3');
})