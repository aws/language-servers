// Create Student class that extends Person and overrides getName method
class Person {
    constructor(name) {
        this.name = name
    }

    getName() {
        return this.name
    }
}

class Student extends Person {
    constructor(name, studentId) {
        super(name)
        this.studentId = studentId
    }

    getName() {
        return `${this.name} (Student ID: ${this.studentId})`
    }
}

// Example usage
let person = new Person('John Doe')
console.log(person.getName()) // Output: John Doe

let student = new Student('Jane Smith', 12345)
console.log(student.getName()) // Output: Jane Smith (Student ID: 12345)
