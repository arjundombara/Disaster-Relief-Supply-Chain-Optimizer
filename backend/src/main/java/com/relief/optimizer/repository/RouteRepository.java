package com.relief.optimizer.repository;

import com.relief.optimizer.model.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    Optional<Route> findByRouteCode(String routeCode);
    boolean existsByRouteCode(String routeCode);
    List<Route> findBySourceDepotId(Long depotId);
    List<Route> findByDestinationPointId(Long dpId);
    List<Route> findByIsAvailableTrue();
}
