/* Farmer model */
export class Farmer {
  /**
   * @param {Object} param0
   * @param {string} param0.id
   * @param {string} param0.name
   * @param {string} param0.email
   * @param {string} param0.phone
   * @param {Date} [param0.created_at]
   * @param {Date} [param0.updated_at]
   */
  constructor({ id, name, email, phone, created_at, updated_at }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  /**
   * Convert instance to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

export default Farmer;
