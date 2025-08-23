import { useEffect, useState } from 'react';

const isLocalhost = window.location.hostname === 'localhost';

class EventManager {
  constructor() {
    this.domEventHandlers = new Map();
    this.emittedEvents = new Map();
    this.currentEmitTokens = new Map();
    this.eventListeners = new Map();
    this.shadowEventHandlers = new Map();
    this.initialized = false;

    // Settings for debugging
    this.verbose = false; // Enable or disable debug mode
    this.debug = window.location.hostname === 'localhost'; // Enable or disable debug mode for emit events only
    this.requiresCondition = false; // Require a condition in the handler

    this._delegate = this._delegate.bind(this);
  }

  initialize() {
    if (this.initialized) return;

    document.addEventListener('DOMContentLoaded', () => {
      this.initialized = true;
      this._verbose('EventManager initialized.');
    });
  }

  onDOM(eventType, selector, handler, options = {}) {
    const { throttle, debounce, passive = true } = options;
    const wrappedHandler = this._wrapHandler(handler, { throttle, debounce });

    if (!this.domEventHandlers.has(eventType)) {
      this.domEventHandlers.set(eventType, []);
      document.addEventListener(eventType, this._delegate, { passive });
      this._verbose(`DOM listener added for event: ${eventType}`);
    }

    const id = Symbol(handler);

    if (
      this.domEventHandlers
        .get(eventType)
        .some((h) => h.selector === selector && h.originalHandler === handler)
    ) {
      this._verbose(`Handler already registered for event: ${eventType}`);
      return () => this.offDOM(eventType, selector, handler);
    }

    this.domEventHandlers.get(eventType).push({
      selector,
      handler: wrappedHandler,
      originalHandler: handler,
      id,
    });

    this._verbose(`Handler added for DOM event: ${eventType}, selector: ${selector}`);

    return () => this.offDOM(eventType, selector, handler, id);
  }

  offDOM(eventType, selector, handler, id) {
    if (!this.domEventHandlers.has(eventType)) return;

    const handlers = this.domEventHandlers.get(eventType);
    const updatedHandlers = handlers.filter(
      (h) => h.selector !== selector || h.originalHandler !== handler || h.id !== id,
    );

    if (updatedHandlers.length > 0) {
      this.domEventHandlers.set(eventType, updatedHandlers);
      this._verbose(`Handler removed for DOM event: ${eventType}, selector: ${selector}`);
    } else {
      this.domEventHandlers.delete(eventType);
      document.removeEventListener(eventType, this._delegate);
      this._verbose(`DOM listener removed for event: ${eventType}`);
    }
  }

  _delegate(event) {
    const eventType = event.type;
    if (!this.domEventHandlers.has(eventType)) return;

    const handlers = this.domEventHandlers.get(eventType);
    this._log(`Delegating ${eventType} event to handlers`, handlers.length);

    handlers.forEach(({ selector, handler }) => {
      let shouldHandle = false;

      if (selector === 'document') {
        shouldHandle = true;
      } else if (selector.startsWith('!!')) {
        const restrictSelector = selector.slice(2);
        shouldHandle = event.target.matches(restrictSelector);
      } else if (selector.startsWith('!')) {
        const excludedSelector = selector.slice(1);
        shouldHandle = !event.target.closest(excludedSelector);
      } else {
        shouldHandle = event.target.matches(selector) || event.target.closest(selector);
      }

      if (shouldHandle) {
        handler(event);
        this._verbose(`Event delegated to handler: ${eventType}, selector: ${selector}`, handler);
      }
    });
  }

  onShadow(eventType, selector, handler, options = {}) {
    const { throttle, debounce, passive = true } = options;
    const wrappedHandler = this._wrapHandler(handler, { throttle, debounce });

    if (!this.shadowEventHandlers.has(eventType)) {
      this.shadowEventHandlers.set(eventType, []);
      const shadowRoot = document.querySelector('#shadow-parent')?.shadowRoot;
      if (shadowRoot) {
        shadowRoot.addEventListener(eventType, this._shadowDelegate.bind(this), { passive });
        this._verbose(`Shadow DOM listener added for event: ${eventType}`);
      } else {
        console.warn('Shadow root not found for #shadow-parent');
      }
    }

    const id = Symbol(handler);

    if (
      this.shadowEventHandlers
        .get(eventType)
        .some((h) => h.selector === selector && h.originalHandler === handler)
    ) {
      this._verbose(`Handler already registered for shadow event: ${eventType}`);
      return () => this.offShadow(eventType, selector, handler);
    }

    this.shadowEventHandlers.get(eventType).push({
      selector,
      handler: wrappedHandler,
      originalHandler: handler,
      id,
    });

    this._verbose(`Handler added for shadow DOM event: ${eventType}, selector: ${selector}`);

    return () => this.offShadow(eventType, selector, handler, id);
  }

  offShadow(eventType, selector, handler, id) {
    if (!this.shadowEventHandlers.has(eventType)) return;

    const handlers = this.shadowEventHandlers.get(eventType);

    const updatedHandlers = handlers.filter(
      (h) => h.selector !== selector || h.originalHandler !== handler || h.id !== id,
    );

    if (updatedHandlers.length > 0) {
      this.shadowEventHandlers.set(eventType, updatedHandlers);
      this._verbose(`Handler removed for shadow DOM event: ${eventType}, selector: ${selector}`);
    } else {
      this.shadowEventHandlers.delete(eventType);
      const shadowRoot = document.querySelector('#shadow-parent')?.shadowRoot;
      if (shadowRoot) {
        shadowRoot.removeEventListener(eventType, this._shadowDelegate.bind(this));
        this._verbose(`Shadow DOM listener removed for event: ${eventType}`);
      }
    }
  }

  _shadowDelegate(event) {
    const eventType = event.type;
    if (!this.shadowEventHandlers.has(eventType)) return;

    const handlers = this.shadowEventHandlers.get(eventType);
    this._log(`Delegating shadow ${eventType} event to handlers`, handlers.length);

    handlers.forEach(({ selector, handler }) => {
      const shadowRoot = document.querySelector('#shadow-parent')?.shadowRoot;
      if (!shadowRoot) return;

      let shouldHandle = false;

      if (selector === 'shadowRoot') {
        shouldHandle = true;
      } else if (selector.startsWith('!!')) {
        const restrictSelector = selector.slice(2);
        shouldHandle = event.target.matches(restrictSelector);
      } else if (selector.startsWith('!')) {
        const excludedSelector = selector.slice(1);
        shouldHandle = !event.target.closest(excludedSelector);
      } else {
        shouldHandle = event.target.matches(selector) || event.target.closest(selector);
      }

      if (shouldHandle) {
        handler(event);
        this._verbose(
          `Shadow event delegated to handler: ${eventType}, selector: ${selector}`,
          handler,
        );
      }
    });
  }

  emit(eventName, updater) {
    const prevToken = this.currentEmitTokens.get(eventName) || 0;
    const newToken = prevToken + 1;
    this.currentEmitTokens.set(eventName, newToken);
    const currentToken = newToken;

    const prevPayload = this.emittedEvents.get(eventName) || {};

    const newPayload = typeof updater === 'function' ? updater(prevPayload) : updater;

    this.emittedEvents.set(eventName, newPayload);

    const payloadStructure = this._generateStructure(newPayload);
    this._log(`Expected structure for event "${eventName}":`, payloadStructure);

    const stack = new Error().stack.split('\n')[2]?.trim();
    if (!this.eventListeners.has(eventName)) {
      this._log(`Sent ${eventName} to NO listeners`, { payload: newPayload, stack });
      return Promise.resolve([]); // what if there's an event listener in a modal that hasn't been opened yet?
    }

    const listenersMap = this.eventListeners.get(eventName);
    const listeners = Array.from(listenersMap.values());

    this._log(`Sent ${eventName} to ${listeners.length} listeners`, {
      payload: newPayload,
      stack,
      listeners,
    });

    const results = listeners.map((listener) => {
      if (this.currentEmitTokens.get(eventName) !== currentToken) {
        this._log(`Aborting listener for ${eventName} due to newer emit.`);
        return Promise.resolve(null);
      }
      try {
        const result = listener(newPayload);

        if (result instanceof Promise) {
          return result.catch((error) => {
            this._error(`Error in listener for event: ${eventName}`, error);
            return null;
          });
        }
        return Promise.resolve(result);
      } catch (error) {
        this._error(`Error in listener for event: ${eventName}`, error);
        return Promise.resolve(null);
      }
    });

    return Promise.all(results);
  }

  get(eventName) {
    const payload = this.emittedEvents.get(eventName) || null;
    this._verbose(`Fetching last emitted event: ${eventName}`, payload);
    return payload;
  }

  on(eventName, listener, replayIfEmitted = true) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Map());
    }

    const listenersMap = this.eventListeners.get(eventName);

    if (listenersMap.has(listener)) {
      this._verbose(`Listener already registered for event: ${eventName}`);
      return () => this.off(eventName, listener);
    }

    const wrappedListener = (payload) => {
      const stack = new Error().stack.split('\n')[2]?.trim();
      this._verbose(`Listening to ${eventName}`, stack);
      listener(payload || {});
    };

    listenersMap.set(listener, wrappedListener);
    this._verbose(`Listener added for event: ${eventName}`);
    wrappedListener.__originalListener = listener;

    if (replayIfEmitted && this.emittedEvents.has(eventName)) {
      const payload = this.emittedEvents.get(eventName);
      wrappedListener(payload || {});
      this._log(`Replaying event: ${eventName}`, payload);
      // console.trace('Function fired at:');
    }

    return () => this.off(eventName, listener);
  }

  off(eventName, listener) {
    if (!this.eventListeners.has(eventName)) return;

    const listenersMap = this.eventListeners.get(eventName);
    const wrappedListener = listenersMap.get(listener);

    if (wrappedListener) {
      listenersMap.delete(listener);
      this._verbose(`Listener removed for event: ${eventName}`);
    }

    if (listenersMap.size === 0) {
      this.eventListeners.delete(eventName);
    }
  }

  _wrapHandler(handler, { throttle, debounce }) {
    const handlerString = handler.toString();

    if (this.requiresCondition) {
      const containsCondition = /(if\s*\(|switch\s*\(|\?.*:)/.test(handlerString);
      if (!containsCondition) {
        throw new Error('Handler must contain a condition.');
      }
    }

    this._verbose('Handler validated for condition:', handlerString);

    if (throttle) {
      return this._throttle(handler, throttle);
    }
    if (debounce) {
      return this._debounce(handler, debounce);
    }
    return handler;
  }

  _verbose(message, data = null) {
    if (!this.verbose) return;

    const stack = new Error().stack.split('\n')[2]?.trim();
    console.debug(`${message} at ${stack}`, data);
  }

  _log(message, data = null) {
    if (!this.debug && !this.verbose) return;

    console.debug(message, data);
  }

  _error(args) {
    if (isLocalhost) {
      console.trace(args);
      return;
    }
    console.debug(args);
  }

  _throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
        this._verbose('Throttled function executed.');
      }
    };
  }

  _debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func(...args);
        this._verbose('Debounced function executed.');
      }, delay);
    };
  }

  type(eventName) {
    if (!this.emittedEvents.has(eventName)) {
      this._log(`No emissions found for event: ${eventName}`);
      return;
    }

    const payload = this.emittedEvents.get(eventName);
    const payloadStructure = this._generateStructure(payload);
    this._log(`Expected structure for event "${eventName}":`, payloadStructure);
  }

  _generateStructure(payload) {
    if (payload === null || payload === undefined) {
      return 'null or undefined';
    }
    if (Array.isArray(payload)) {
      return payload.length > 0 ? [this._generateStructure(payload[0])] : [];
    }
    if (typeof payload === 'object') {
      return Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [key, this._generateStructure(value)]),
      );
    }
    return typeof payload;
  }
}

export const events = new EventManager();

// Use inside React components
export const useEvent = (eventName, listener, replayIfEmitted = false) => {
  useEffect(() => {
    if (!eventName || typeof listener !== 'function') return;

    const off = events.on(eventName, listener, replayIfEmitted);
    return () => off();
  }, [eventName, listener, replayIfEmitted]);
};

export const emitEvent = (eventName, payload) => {
  if (!eventName) return;
  events.emit(eventName, payload);
};

export const useEventState = (eventName, defaultValue) => {
  const [state, setState] = useState(defaultValue);
  useEvent(
    eventName,
    (payload) => {
      setState(payload);
    },
    false,
  );
  const eventSetter = (payload) => emitEvent(eventName, payload);
  return [state, eventSetter];
};

// Use outside React components
export const setEventState = (eventName, payload) => {
  if (!eventName) return;
  emitEvent(eventName, payload);
};

export const onEventState = (eventName, listener) => {
  if (!eventName || typeof listener !== 'function') return;
  return events.on(eventName, listener);
};
