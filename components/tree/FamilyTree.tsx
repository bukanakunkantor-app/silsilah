'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { Person, Marriage } from '@/lib/supabase'
import { buildTreeLayout, TreeNode, TreeEdge } from '@/lib/tree-utils'
import PersonNode from './PersonNode'
import SearchBar from './SearchBar'
import DetailPanel from './DetailPanel'
import styles from './FamilyTree.module.css'

interface FamilyTreeProps {
  persons: Person[]
  marriages: Marriage[]
  familyName?: string
}

const nodeTypes = { personNode: PersonNode }

function FamilyTreeInner({ persons, marriages, familyName = 'Silsilah Keluarga' }: FamilyTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const { fitView, setCenter } = useReactFlow()

  // Build & refresh layout whenever data or collapsed state changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildTreeLayout(persons, marriages, collapsedNodes)

    const enrichedNodes = newNodes.map((n: TreeNode) => ({
      ...n,
      data: {
        ...n.data,
        onToggleCollapse: handleToggleCollapse,
        onSelectPerson: handleSelectPerson,
        isHighlighted: highlightedId === n.id,
        isDimmed: highlightedId !== null && highlightedId !== n.id,
      }
    }))

    setNodes(enrichedNodes as Node[])
    setEdges(newEdges as Edge[])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persons, marriages, collapsedNodes, highlightedId])

  // Fit view on initial load
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2, duration: 600 }), 200)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persons.length])

  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectPerson = useCallback((person: Person) => {
    setSelectedPerson(person)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedPerson(null)
  }, [])

  // Search: highlight + center on result
  const handleSearchSelect = useCallback((person: Person) => {
    setHighlightedId(person.id)
    setSelectedPerson(person)

    // Find and center on the node
    const targetNode = nodes.find(n => n.id === person.id)
    if (targetNode) {
      setCenter(targetNode.position.x + 50, targetNode.position.y + 50, { zoom: 1.5, duration: 800 })
    }

    // Clear highlight after 3s
    setTimeout(() => setHighlightedId(null), 3000)
  }, [nodes, setCenter])

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 600 })
  }, [fitView])

  // Get related persons (spouses + children) for detail panel
  const relatedPersons = useMemo((): Person[] => {
    if (!selectedPerson) return []
    const personMap = new Map(persons.map(p => [p.id, p]))
    const related: Person[] = []

    // Spouse(s)
    marriages.forEach(m => {
      if (m.husband_id === selectedPerson.id) {
        const wife = personMap.get(m.wife_id)
        if (wife) related.push(wife)
      }
      if (m.wife_id === selectedPerson.id) {
        const husband = personMap.get(m.husband_id)
        if (husband) related.push(husband)
      }
    })

    // Children
    persons
      .filter(p => p.parent_id === selectedPerson.id)
      .forEach(child => related.push(child))

    return related
  }, [selectedPerson, persons, marriages])

  const totalPersons = persons.length
  const aliveCount = persons.filter(p => p.is_alive).length
  const generationCount = persons.length > 0
    ? Math.max(...persons.map(p => p.generation))
    : 0

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 4-2 8-2s4 2 8 2v-2c-4 0-4-2-8-2-1.17 0-1.91.17-2.53.33C14.28 12.22 16 10.35 17 8zm-7.36 4.4c.27-.15.55-.29.83-.42-.08.44-.19.88-.31 1.32-.32-.28-.57-.58-.52-.9zM12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0-2a6 6 0 0 0-6 6c0 3.31 2.69 6 6 6s6-2.69 6-6a6 6 0 0 0-6-6z"/>
            </svg>
          </div>
          <div>
            <h1 className={styles.title}>{familyName}</h1>
            <p className={styles.subtitle}>
              {totalPersons} anggota · {generationCount} generasi · {aliveCount} masih hidup
            </p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <SearchBar persons={persons} onSelect={handleSearchSelect} />
        </div>
      </header>

      {/* Tree canvas */}
      <div className={styles.canvas}>
        {persons.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 4-2 8-2s4 2 8 2v-2c-4 0-4-2-8-2-1.17 0-1.91.17-2.53.33C14.28 12.22 16 10.35 17 8z"/>
                <circle cx="12" cy="5" r="3"/>
              </svg>
            </div>
            <h2>Pohon Keluarga Kosong</h2>
            <p>Belum ada data anggota keluarga.<br />Silakan login sebagai admin untuk menambahkan.</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={3}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#D4E8D4"
            />
            <Controls
              showInteractive={false}
              className={styles.controls}
            />
            <MiniMap
              nodeColor={(n) => {
                const p = (n.data as { person: Person }).person
                if (p?.gender === 'female') return '#FCE4EC'
                return '#E3F2FD'
              }}
              maskColor="rgba(244, 250, 244, 0.85)"
              className={styles.minimap}
            />

            {/* Fit view button */}
            <Panel position="bottom-right" className={styles.fitPanel}>
              <button
                className={styles.fitBtn}
                onClick={handleFitView}
                aria-label="Tampilkan semua"
                title="Tampilkan semua"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              </button>
            </Panel>

            {/* Generation legend */}
            <Panel position="top-left" className={styles.legend}>
              <div className={styles.legendItem}>
                <span className={styles.legendDotMale} />
                <span>Laki-laki</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDotFemale} />
                <span>Perempuan</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendLineParent} />
                <span>Keturunan</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendLineSpouse} />
                <span>Pasangan</span>
              </div>
            </Panel>
          </ReactFlow>
        )}
      </div>

      {/* Detail Panel */}
      <DetailPanel
        person={selectedPerson}
        relatedPersons={relatedPersons}
        onClose={handleCloseDetail}
      />
    </div>
  )
}

export default function FamilyTree(props: FamilyTreeProps) {
  return (
    <FamilyTreeInner {...props} />
  )
}
