import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Language, Department } from '@prisma/client';
import { DepartmentRepository } from '../repositories/department.repository';
import { I18nService } from '../common/i18n';

/**
 * Department Service - Business logic for department operations
 *
 * This service provides high-level operations for departments, coordinating
 * between repositories and applying business rules.
 */
@Injectable()
export class DepartmentService {
  private readonly logger = new Logger(DepartmentService.name);

  constructor(
    private readonly departmentRepository: DepartmentRepository,
    private readonly i18nService: I18nService,
  ) {}

  /**
   * Gets a department by its slug
   *
   * @param {string} slug - The department slug
   * @param {Language} language - The language for translation (optional, uses context if not provided)
   * @returns {Promise<Department>} The department
   * @throws {NotFoundException} If department is not found
   *
   * @example
   * const dept = await getDepartmentBySlug('tecnologia', Language.ES);
   */
  async getDepartmentBySlug(
    slug: string,
    language?: Language,
  ): Promise<Department> {
    const lang = language || this.i18nService.getCurrentLanguage();

    this.logger.debug(`Getting department by slug: ${slug}, language: ${lang}`);

    const department = await this.departmentRepository.findBySlug(slug, lang);

    if (!department) {
      throw new NotFoundException(
        `Department with slug '${slug}' not found for language '${lang}'`,
      );
    }

    return department;
  }

  /**
   * Gets all departments with pagination
   *
   * @param {number} limit - Maximum number of departments to return (default: 20)
   * @param {number} offset - Number of departments to skip (default: 0)
   * @param {Language} language - The language for translations (optional, uses context if not provided)
   * @returns {Promise<Department[]>} Array of departments
   *
   * @example
   * const departments = await getDepartments(10, 0, Language.ES);
   */
  async getDepartments(
    limit: number = 20,
    offset: number = 0,
    language?: Language,
  ): Promise<Department[]> {
    const lang = language || this.i18nService.getCurrentLanguage();

    this.logger.debug(
      `Getting departments: limit=${limit}, offset=${offset}, language=${lang}`,
    );

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    const departments = await this.departmentRepository.findAll(limit, offset);

    this.logger.debug(`Found ${departments.length} departments`);

    return departments;
  }

  /**
   * Gets a department by ID
   *
   * @param {number} id - The department ID
   * @returns {Promise<Department>} The department
   * @throws {NotFoundException} If department is not found
   */
  async getDepartmentById(id: number): Promise<Department> {
    this.logger.debug(`Getting department by ID: ${id}`);

    const loader = this.departmentRepository.createDepartmentLoader();
    const department = await loader.load(id);

    if (!department) {
      throw new NotFoundException(`Department with ID '${id}' not found`);
    }

    return department;
  }
}
