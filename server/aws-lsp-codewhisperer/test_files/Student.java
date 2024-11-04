// Create Student class that extends Person and overrides getName method
class Person {
    String name;

    public Person(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}

class Student extends Person {
    int id;

    public Student(String name, int id) {
        super(name);
        this.id = id;
    }

    @Override
    public String getName() {
        return super.getName() + " (Student ID: " + id + ")";
    }
}

// Example usage
public class Main {
    public static void main(String[] args) {
        Person person = new Person("John Doe");
        System.out.println(person.getName()); // Output: John Doe

        Student student = new Student("Jane Smith", 12345);
        System.out.println(student.getName()); // Output: Jane Smith (Student ID: 12345)
    }
}