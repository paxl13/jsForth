'use strict';

// apply a transformation to every and each element of an iterator.
export function map(fct) {
  return function*(iterator) {
    for (let elem of iterator) {
      yield fct(elem);
    }
  };
}
