// © 2020 Google LLC.  All rights reserved.
//
// This software is subject to the Google Cloud Terms of Service, as
// modified by the "General Software Terms" of the Google Cloud Service Specific Terms, available at: https://cloud.google.com/terms/service-terms.

function example() {
  return 'hi';
}

describe('example', () => {
  test('should say hi', () => {
    expect(example()).toBe('hi');
  });
});
