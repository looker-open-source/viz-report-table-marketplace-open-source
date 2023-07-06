function example() {
  return 'hi';
}

describe('example', () => {
  test('should say hi', () => {
    expect(example()).toBe('hi');
  });
});
