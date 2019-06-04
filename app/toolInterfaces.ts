

interface Acceptor<T> {
    accept(o: T): boolean;
    //gives this a new T (o)

    update(o: T): boolean;
    //tells this that o is changed

    complete(o: T): boolean;
    //tells this that o is fully formed 

}


export {
    Acceptor
}
