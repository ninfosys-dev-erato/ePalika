import { faker } from "@faker-js/faker";
export const randomName = () => faker.person.fullName();
export const randomEmail = () => faker.internet.email();
export const randomSentence = () => faker.lorem.sentence();
