## xy

The XY model is a toy model of a two dimensional ferromagnetic where the degrees of freedom consist of an angle S_i \in [0,2\pi] for each site i of a rectangular lattice, thought of as the magnetic dipole of an atomic magnet sitting at the site i. The energy of a configuration comes from the angles pointing different directions. We use the "Heisenberg" Hamiltonian

H = \sum_{neighboring sites ij} - cos(S_i - S_j)

which has its minimum when all angles are equal. As in well known, however, by the Mermin-Wagner theorem for example, thermal fluctuations in the average angle are large meaning that on long length scales the system does not settle into a particular angle at any temperature but rather explores all the angles all over the system.

Another feature of this system is the existence of vortices, special locations in the plane around with the angles make a several full rotations. In our visualization, angle is represented by hue, so a vortex looks like this:

![Vortex](vortex.png)

There are also antivortices, and they are created and annihilated in vortex-antivortex pairs, which looks like this:

![Vortex Pair](vortex-pair.png)

In controlling the simulation, press h for hotter temperatures and c for colder temperatures. You can also hold spacebar while moving the mouse to create disturbances.

At low temperatures, the force between vortices is dominated by the energy and goes with distance as 1/r, causing an eventually collapse of all vortex-antivortex pairs. As the temperature increases however, a repulsive entropic force between vortices eventually dominates, leading to a phase transition to a regime where vortices are unbound and the angles are basically uncorrelated at large distances. This transition, the Kosterlitz-Thouless transition, is very special among classical phase transitions because it cannot be understood in a symmetry-breaking framework. It was one of the breakthroughs mentioned in the 2016 Nobel prize announcements.

Finally, here is a screenshot of a typical glassy configuration at zero temperature, created using Dirichlet boundary conditions in a topologically nontrivial sector:

![zero-temp](zero-temp.png)

Some technical comments. The way we simulate time evolution in this model is using Glauber dynamics. At each time step, we iterate over all lattice sites i, then choose a random angle S_i^{new} at that site for replacement. We compute the difference in energy \Delta E between the initial configuration and the configuration where the angle S_i^{old} is replaced with the random angle S_i^{new}. This energy difference, along with the temperature, defines the Boltzmann probability

p = 1/(1+\exp(-\Delta E/T)).

Then the simulator chooses another random variable 0<X<1 and if X<p, we replace S_i^{old} with S_i^{new}. Otherwise, no change of state is made. What makes this algorithm quick is that \Delta E may be computed using only 5 sites, since the terms in H directly couple only nearest neighbors. A model with a Hamiltonian like \sum_i \sum_j cos(S_i-S_j)/|i-j| for instance, would be much harder to simulate.

### install

```
git clone https://github.com/enspiral-cherubi/xy-model
cd xy
npm install
```

### test

```
npm start
```

browse to <http://localhost:9966/>.

