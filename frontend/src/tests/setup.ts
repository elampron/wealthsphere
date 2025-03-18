import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};

// Mock TextEncoder/TextDecoder
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = jest.fn().mockImplementation(() => ({
    encode: jest.fn((text: string) => new Uint8Array(text.split('').map((c: string) => c.charCodeAt(0)))),
  }));
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = jest.fn().mockImplementation(() => ({
    decode: jest.fn((buffer: ArrayBuffer | ArrayBufferView) => 
      String.fromCharCode(...new Uint8Array(buffer instanceof ArrayBuffer ? buffer : buffer.buffer))),
  }));
} 