## xy

The XY model is a toy model of a two dimensional ferromagnetic where the degrees of freedom consist of an angle S_i \in [0,2\pi] for each vertex i of a rectangular lattice. The energy of a configuration comes from the angles pointing different directions. We use the "Heisenberg" Hamiltonian

H = \sum_{neighbors ij} - cos(S_i - S_j)

which has its minimum when all angles are equal. As in well known, however, by the Mermin-Wagner theorem for example, thermal fluctuations in the average angle are large meaning that on long length scales the system does not settle into a particular angle at any temperature but rather explores all the angles all over the system.

Another feature of this system is the existence of vortices, special locations in the plane around with the angles make a several full rotations.

![alt text](xy-model/vortex.png?raw=true "Vortex")


### install

```
git clone https://github.com/topological-ragnar/xy
cd xy
npm install
```

### test

```
npm start
```

browse to <http://localhost:9966/>.

