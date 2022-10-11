const JumpTree = require('../game/jumpTree');

describe('JumpTree tests', () => {
    test('Depth scan test', () => {
        let j = new JumpTree(0, 3);
        expect(j.getDepth()).toBe(1);
        j.addNext(1, 2);
        j.addNext(1, 4);
        j.next[1].addNext(2, 5);
        expect(j.getDepth()).toBe(3);
    });
    
    test('Pruning test', () => {
        let j = new JumpTree(0, 3);
        j.addNext(2, 1);
        j.addNext(2, 5);
        j.next[1].addNext(0, 7);
        j.next[1].addNext(4, 3);
        j.next[1].addNext(4, 7);
        j.next[1].next[1].addNext(6, 5);
        j.next[1].next[2].addNext(6, 5);
        j.next[1].next[1].addNext(6, 1);

        let depth = j.getDepth();
        expect(depth).toBe(4);
        expect(j.pruneToDepth(depth-1)).toBe(true);
        expect(j.width).toBe(1); // originally had two children, one whose path ended at depth 2
        expect(j.next[0].width).toBe(2); // originally had three children, third's path ended at 3
        let jsub = j.next[0];
        expect(jsub.next[0].width).toBe(2);
        for (let node of jsub.next[0].next) {
            expect(node.isLeaf()).toBe(true);
        }
        expect(jsub.next[1].width).toBe(1);
        expect(jsub.next[1].next[0].isLeaf()).toBe(true);
    });
});