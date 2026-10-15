package com.kohort.ems.security;

import com.kohort.ems.model.Department;
import com.kohort.ems.model.Employee;
import com.kohort.ems.model.EmploymentStatus;
import com.kohort.ems.model.User;
import com.kohort.ems.repository.DepartmentRepository;
import com.kohort.ems.repository.EmployeeRepository;
import com.kohort.ems.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           DepartmentRepository departmentRepository,
                           EmployeeRepository employeeRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedAdminUser();
        seedDepartments();
        seedSampleEmployees();
    }

    private void seedAdminUser() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role("ROLE_ADMIN")
                    .build();
            userRepository.save(admin);
            log.info("Default administrator seeded: username='admin', password='admin123'");
        }
    }

    private void seedDepartments() {
        if (departmentRepository.count() == 0) {
            List<Department> departments = List.of(
                    Department.builder().name("Engineering").description("Software development, QA, and DevOps").build(),
                    Department.builder().name("Human Resources").description("Talent acquisition, employee care, and payroll").build(),
                    Department.builder().name("Product & Design").description("Product strategy, roadmap, and UI/UX architecture").build(),
                    Department.builder().name("Marketing & Sales").description("Brand marketing, client growth, and revenue operations").build(),
                    Department.builder().name("Finance & Legal").description("Accounting, treasury, and regulatory compliance").build()
            );
            departmentRepository.saveAll(departments);
            log.info("Default departments initialized successfully.");
        }
    }

    private void seedSampleEmployees() {
        if (employeeRepository.count() == 0) {
            Department eng = departmentRepository.findByNameIgnoreCase("Engineering").orElse(null);
            Department hr = departmentRepository.findByNameIgnoreCase("Human Resources").orElse(null);
            Department prod = departmentRepository.findByNameIgnoreCase("Product & Design").orElse(null);

            if (eng != null && hr != null && prod != null) {
                List<Employee> initialEmployees = List.of(
                        Employee.builder()
                                .employeeId("EMP-1001")
                                .fullName("Alexander Wright")
                                .email("alexander.wright@company.com")
                                .phoneNumber("+1 (555) 234-5678")
                                .department(eng)
                                .designation("Lead Software Architect")
                                .dateOfJoining(LocalDate.of(2022, 3, 15))
                                .salary(new BigDecimal("135000.00"))
                                .status(EmploymentStatus.Active)
                                .build(),
                        Employee.builder()
                                .employeeId("EMP-1002")
                                .fullName("Elena Rostova")
                                .email("elena.rostova@company.com")
                                .phoneNumber("+1 (555) 345-6789")
                                .department(prod)
                                .designation("Principal Product Designer")
                                .dateOfJoining(LocalDate.of(2022, 6, 1))
                                .salary(new BigDecimal("118000.00"))
                                .status(EmploymentStatus.Active)
                                .build(),
                        Employee.builder()
                                .employeeId("EMP-1003")
                                .fullName("Marcus Chen")
                                .email("marcus.chen@company.com")
                                .phoneNumber("+1 (555) 456-7890")
                                .department(eng)
                                .designation("Senior Backend Engineer")
                                .dateOfJoining(LocalDate.of(2023, 1, 10))
                                .salary(new BigDecimal("105000.00"))
                                .status(EmploymentStatus.Active)
                                .build(),
                        Employee.builder()
                                .employeeId("EMP-1004")
                                .fullName("Sophia Morales")
                                .email("sophia.morales@company.com")
                                .phoneNumber("+1 (555) 567-8901")
                                .department(hr)
                                .designation("People Operations Lead")
                                .dateOfJoining(LocalDate.of(2021, 9, 20))
                                .salary(new BigDecimal("92000.00"))
                                .status(EmploymentStatus.Active)
                                .build(),
                        Employee.builder()
                                .employeeId("EMP-1005")
                                .fullName("Liam O'Connor")
                                .email("liam.oconnor@company.com")
                                .phoneNumber("+1 (555) 678-9012")
                                .department(eng)
                                .designation("DevOps Engineer")
                                .dateOfJoining(LocalDate.of(2023, 8, 14))
                                .salary(new BigDecimal("98000.00"))
                                .status(EmploymentStatus.Inactive)
                                .build()
                );
                employeeRepository.saveAll(initialEmployees);
                log.info("Initial employees seeded into database.");
            }
        }
    }
}
