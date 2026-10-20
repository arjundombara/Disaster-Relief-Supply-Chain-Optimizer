package com.relief.optimizer.service;

import com.relief.optimizer.dto.RouteDto;
import com.relief.optimizer.exception.ResourceNotFoundException;
import com.relief.optimizer.exception.ValidationException;
import com.relief.optimizer.model.Depot;
import com.relief.optimizer.model.DistributionPoint;
import com.relief.optimizer.model.Route;
import com.relief.optimizer.repository.DepotRepository;
import com.relief.optimizer.repository.DistributionPointRepository;
import com.relief.optimizer.repository.RouteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RouteService {

    private final RouteRepository routeRepository;
    private final DepotRepository depotRepository;
    private final DistributionPointRepository dpRepository;

    @Autowired
    public RouteService(RouteRepository routeRepository,
                        DepotRepository depotRepository,
                        DistributionPointRepository dpRepository) {
        this.routeRepository = routeRepository;
        this.depotRepository = depotRepository;
        this.dpRepository = dpRepository;
    }

    public List<RouteDto> getAllRoutes() {
        return routeRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<RouteDto> getAvailableRoutes() {
        return routeRepository.findByIsAvailableTrue().stream().map(this::toDto).collect(Collectors.toList());
    }

    public RouteDto getById(Long id) {
        return toDto(routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found: " + id)));
    }

    public RouteDto create(RouteDto dto) {
        validate(dto);
        if (routeRepository.existsByRouteCode(dto.getRouteCode())) {
            throw new ValidationException("Route with code '" + dto.getRouteCode() + "' already exists");
        }
        Depot depot = depotRepository.findById(dto.getSourceDepotId())
                .orElseThrow(() -> new ResourceNotFoundException("Source depot not found: " + dto.getSourceDepotId()));
        DistributionPoint dp = dpRepository.findById(dto.getDestinationPointId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination point not found: " + dto.getDestinationPointId()));

        Route route = new Route(null, dto.getRouteCode(), depot, dp,
                dto.getCapacity(), dto.getDistanceKm(), dto.getTravelTimeHours(),
                dto.getRoadCondition(), dto.getIsAvailable());
        return toDto(routeRepository.save(route));
    }

    public RouteDto update(Long id, RouteDto dto) {
        validate(dto);
        Route existing = routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found: " + id));
        if (!existing.getRouteCode().equals(dto.getRouteCode()) && routeRepository.existsByRouteCode(dto.getRouteCode())) {
            throw new ValidationException("Route with code '" + dto.getRouteCode() + "' already exists");
        }
        Depot depot = depotRepository.findById(dto.getSourceDepotId())
                .orElseThrow(() -> new ResourceNotFoundException("Source depot not found: " + dto.getSourceDepotId()));
        DistributionPoint dp = dpRepository.findById(dto.getDestinationPointId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination point not found: " + dto.getDestinationPointId()));

        existing.setRouteCode(dto.getRouteCode());
        existing.setSourceDepot(depot);
        existing.setDestinationPoint(dp);
        existing.setCapacity(dto.getCapacity());
        existing.setDistanceKm(dto.getDistanceKm() != null ? dto.getDistanceKm() : 0.0);
        existing.setTravelTimeHours(dto.getTravelTimeHours() != null ? dto.getTravelTimeHours() : 0.0);
        existing.setRoadCondition(dto.getRoadCondition() != null ? dto.getRoadCondition() : "CLEAR");
        existing.setIsAvailable(dto.getIsAvailable() != null ? dto.getIsAvailable() : true);
        return toDto(routeRepository.save(existing));
    }

    public void delete(Long id) {
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route not found: " + id));
        routeRepository.delete(route);
    }

    private void validate(RouteDto dto) {
        if (dto.getCapacity() != null && dto.getCapacity() < 0) {
            throw new ValidationException("Route capacity cannot be negative");
        }
        if (dto.getSourceDepotId() == null) {
            throw new ValidationException("Source depot is required");
        }
        if (dto.getDestinationPointId() == null) {
            throw new ValidationException("Destination distribution point is required");
        }
    }

    public RouteDto toDto(Route r) {
        RouteDto dto = new RouteDto();
        dto.setId(r.getId());
        dto.setRouteCode(r.getRouteCode());
        dto.setSourceDepotId(r.getSourceDepot().getId());
        dto.setSourceDepotName(r.getSourceDepot().getName());
        dto.setSourceDepotCode(r.getSourceDepot().getCode());
        dto.setDestinationPointId(r.getDestinationPoint().getId());
        dto.setDestinationPointName(r.getDestinationPoint().getName());
        dto.setDestinationPointCode(r.getDestinationPoint().getCode());
        dto.setCapacity(r.getCapacity());
        dto.setDistanceKm(r.getDistanceKm());
        dto.setTravelTimeHours(r.getTravelTimeHours());
        dto.setRoadCondition(r.getRoadCondition());
        dto.setIsAvailable(r.getIsAvailable());
        return dto;
    }
}
