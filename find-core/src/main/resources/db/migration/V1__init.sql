SET SCHEMA find;

CREATE TABLE search_string_filters
(
  search_parametric_values_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  search_id BIGINT NOT NULL,
  field NVARCHAR(21844) NOT NULL,
  value NVARCHAR(21844) NOT NULL
);
