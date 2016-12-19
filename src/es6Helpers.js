'use strict';

export function map(fct) {
  return function*(iterator) {
    for (let elem of iterator) {
      yield fct(elem);
    }
  };
}

export function filter(fct) {
  return function*(iterator) {
    for (let elem of iterator) {
      if (fct(elem)) {
        yield elem;
      }
    }
  };
}

export function STATIC(obj, name, fct) {
  if (!obj[name]) {
    obj[name] = fct();
  }

  return obj[name];
}
