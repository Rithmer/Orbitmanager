import {
  normalizeIds,
  groupByNumberKey,
  pickGroupedByIds,
} from './read-model-response.factory';

describe('read-model-response helpers', () => {
  it('normalizes ids from strings and arrays', () => {
    expect(normalizeIds('1, 2, 2, 0, abc')).toEqual([1, 2]);
    expect(normalizeIds(['3', '4,5'])).toEqual([3, 4, 5]);
  });

  it('groups items by numeric key', () => {
    const grouped = groupByNumberKey(
      [
        { id: 1, groupId: 10 },
        { id: 2, groupId: 10 },
        { id: 3, groupId: 20 },
      ],
      (item) => item.groupId,
    );

    expect(grouped).toEqual({
      10: [
        { id: 1, groupId: 10 },
        { id: 2, groupId: 10 },
      ],
      20: [{ id: 3, groupId: 20 }],
    });
  });

  it('selects requested grouped keys and fills missing ones', () => {
    const selected = pickGroupedByIds(
      {
        1: [{ id: 1 }],
        3: [{ id: 3 }],
      },
      [1, 2, 3],
    );

    expect(selected).toEqual({
      1: [{ id: 1 }],
      2: [],
      3: [{ id: 3 }],
    });
  });
});
