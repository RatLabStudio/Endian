import * as CANNON from 'cannon-es';

export const groundMaterial = new CANNON.Material('ground');
export const slipperyMaterial = new CANNON.Material('slippery');

groundMaterial.friction = 0;
groundMaterial.restitution = 0.3;
slipperyMaterial.friction = 0;
slipperyMaterial.restitution = 0.3;

let world;
export function initialize(physicsWorld) {
    world = physicsWorld;

    // Adjust constraint equation parameters for ground/ground contact
    const ground_ground = new CANNON.ContactMaterial(groundMaterial, groundMaterial, {
        friction: 0.4,
        restitution: 0.3,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
        frictionEquationStiffness: 1e8,
        frictionEquationRegularizationTime: 3,
    });

    // Add contact material to the world
    world.addContactMaterial(ground_ground);

    // The ContactMaterial defines what happens when two materials meet.
    // In this case we want friction coefficient = 0.0 when the slippery material touches ground.
    const slippery_ground = new CANNON.ContactMaterial(groundMaterial, slipperyMaterial, {
        friction: 0,
        restitution: 0.3,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
    });

    // We must add the contact materials to the world
    world.addContactMaterial(slippery_ground);
}