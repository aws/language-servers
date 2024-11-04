package toy;

import java.util.ArrayList;

public class ToyStore {
    private ArrayList<Toy> toys;

    public ToyStore() {
        toys = new ArrayList<>();
    }

    public void addToy(Toy toy) {
        toys.add(toy);
    }

    public void updateToyWeight(int toyId, double newWeight) {
        for (Toy toy : toys) {
            if (toy.getId() == toyId) {
                toy.setWeight(newWeight);
                break;
            }
        }
    }

    public void removeToy(int toyId) {
        for (Toy toy : toys) {
            if (toy.getId() == toyId) {
                toys.remove(toy);
                break;
            }
        }
    }

    public ArrayList<Toy> getToys() {
        return toys;
    }
}