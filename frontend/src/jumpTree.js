class JumpTree {
    constructor(row, column) {
        this.pos = [row, column];
        this.next = [];
    }
    
    addNext(row, column) {
        this.next.push(new JumpTree(row, column));
    }
    
    get width() {
        return this.next.length;
    }

    isLeaf() {
        return this.next.length === 0;
    }
    
    getDepth() {
        if (this.isLeaf()) {
            return 1;
        }   
        return this.next
            .map(subtree => subtree.getDepth())
            .reduce((p, c) => c > p? c : p)+1; // reduce to maximum
    }
    // Removes paths from root no longer than l.
    // Returns false if this subtree is to be removed.
    pruneToDepth(l) {
        if (l <= 0) return true;
        if (l <= 1) return !this.isLeaf();
        
        let newNext = this.next.filter(n => n.pruneToDepth(l-1));
        this.next = newNext;
        return this.next.length > 0;
    }
}

export default JumpTree;