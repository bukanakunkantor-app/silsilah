import { supabase, Person, Marriage } from './supabase'

export interface TreeNode {
  id: string
  type: 'personNode' | 'generationNode'
  position: { x: number; y: number }
  data: any
}

export interface TreeEdge {
  id: string
  source: string
  target: string
  type: 'smoothstep' | 'default'
  style?: React.CSSProperties
  animated?: boolean
  data?: { relation: 'parent-child' | 'spouse' }
}

export interface FamilyData {
  persons: Person[]
  marriages: Marriage[]
}

// Fetch all family data from Supabase
export async function fetchFamilyData(): Promise<FamilyData> {
  const [personsResult, marriagesResult] = await Promise.all([
    supabase.from('persons').select('*').order('generation', { ascending: true }).order('birth_date', { ascending: true }),
    supabase.from('marriages').select('*')
  ])

  if (personsResult.error) throw personsResult.error
  if (marriagesResult.error) throw marriagesResult.error

  return {
    persons: personsResult.data || [],
    marriages: marriagesResult.data || []
  }
}

// Build a map of parent -> children
function buildChildrenMap(persons: Person[]): Map<string, Person[]> {
  const map = new Map<string, Person[]>()
  for (const person of persons) {
    if (person.parent_id) {
      const children = map.get(person.parent_id) || []
      children.push(person)
      map.set(person.parent_id, children)
    }
  }
  return map
}

// Build spouse map from marriages
function buildSpouseMap(persons: Person[], marriages: Marriage[]): Map<string, Person[]> {
  const personMap = new Map(persons.map(p => [p.id, p]))
  const spouseMap = new Map<string, Person[]>()

  for (const marriage of marriages) {
    const husband = personMap.get(marriage.husband_id)
    const wife = personMap.get(marriage.wife_id)
    if (!husband || !wife) continue

    const husbandSpouses = spouseMap.get(marriage.husband_id) || []
    if (!husbandSpouses.find(s => s.id === wife.id)) husbandSpouses.push(wife)
    spouseMap.set(marriage.husband_id, husbandSpouses)

    const wifeSpouses = spouseMap.get(marriage.wife_id) || []
    if (!wifeSpouses.find(s => s.id === husband.id)) wifeSpouses.push(husband)
    spouseMap.set(marriage.wife_id, wifeSpouses)
  }

  return spouseMap
}

const HORIZONTAL_SPACING = 130 // Very compact spacing for normal siblings
const VERTICAL_SPACING = 200 // Tall vertical for generation dividers
const SPOUSE_OFFSET = 110 // 100px node width + 10px gap (sebelahan dekat)

// Layout the tree using BFS with custom positioning
export function buildTreeLayout(
  persons: Person[],
  marriages: Marriage[],
  collapsedNodes: Set<string>
): { nodes: TreeNode[]; edges: TreeEdge[] } {
  if (persons.length === 0) return { nodes: [], edges: [] }

  const childrenMap = buildChildrenMap(persons)
  const spouseMap = buildSpouseMap(persons, marriages)

  // Find roots (no parent or parent not in our data)
  const personIds = new Set(persons.map(p => p.id))
  let roots = persons.filter(p => !p.parent_id || !personIds.has(p.parent_id))

  // Prevent married-in spouses from becoming independent roots far to the right
  const marriedIn = new Set<string>()
  for (const m of marriages) {
    const husband = persons.find(p => p.id === m.husband_id)
    const wife = persons.find(p => p.id === m.wife_id)
    if (husband && wife) {
      if (husband.parent_id && !wife.parent_id) {
        marriedIn.add(wife.id)
      } else if (wife.parent_id && !husband.parent_id) {
        marriedIn.add(husband.id)
      } else if (!husband.parent_id && !wife.parent_id) {
        // Both are roots, arbitrarily set wife as married-in to collapse them
        marriedIn.add(wife.id)
      }
    }
  }

  roots = roots.filter(p => !marriedIn.has(p.id))

  const nodes: TreeNode[] = []
  const edges: TreeEdge[] = []
  const positioned = new Set<string>()

  // BFS layout
  let xCounter = 0

  function layoutSubtree(person: Person, depth: number): number {
    if (positioned.has(person.id)) return 0
    positioned.add(person.id)

    const children = collapsedNodes.has(person.id)
      ? []
      : (childrenMap.get(person.id) || [])

    let subtreeWidth = 0
    let childStartX = 0

    if (children.length === 0) {
      // Leaf node
      const x = xCounter * HORIZONTAL_SPACING
      const spouses = spouseMap.get(person.id) || []
      
      // Advance xCounter based on how many spouses this leaf node has
      xCounter += (1 + spouses.length)

      nodes.push({
        id: person.id,
        type: 'personNode',
        position: { x, y: depth * VERTICAL_SPACING },
        data: {
          person,
          spouses,
          isCollapsed: collapsedNodes.has(person.id),
          hasChildren: (childrenMap.get(person.id) || []).length > 0,
          generation: person.generation
        }
      })
      return x
    }

    // Layout children first
    const childPositions: number[] = []

    for (const child of children) {
      const childX = layoutSubtree(child, depth + 1)
      childPositions.push(childX)

      // Parent-child edge
      edges.push({
        id: `edge-${person.id}-${child.id}`,
        source: person.id,
        target: child.id,
        type: 'smoothstep',
        style: { stroke: 'var(--color-accent)', strokeWidth: 2 },
        data: { relation: 'parent-child' }
      })
    }

    // Position parent above center of children
    const parentX = children.length === 1
      ? childPositions[0]
      : (childPositions[0] + childPositions[childPositions.length - 1]) / 2

    const spouses = spouseMap.get(person.id) || []
    nodes.push({
      id: person.id,
      type: 'personNode',
      position: { x: parentX, y: depth * VERTICAL_SPACING },
      data: {
        person,
        spouses,
        isCollapsed: collapsedNodes.has(person.id),
        hasChildren: true,
        generation: person.generation
      }
    })

    // Ensure the global xCounter clears the parent's spouses so the next sibling tree doesn't overlap
    const parentRightBoundary = parentX + (spouses.length * SPOUSE_OFFSET)
    const neededXCounter = Math.ceil(parentRightBoundary / HORIZONTAL_SPACING) + 1
    if (xCounter < neededXCounter) {
      xCounter = neededXCounter
    }

    return parentX
  }

  // Layout each root
  let rootIndex = 0
  for (const root of roots) {
    if (rootIndex > 0) xCounter += 1 // gap between root trees
    layoutSubtree(root, 0)
    rootIndex++
  }

  // Add spouse nodes for marriages (displayed beside their spouse)
  const addedSpouseNodes = new Set<string>()
  for (const marriage of marriages) {
    const husbandNode = nodes.find(n => n.id === marriage.husband_id)
    const wifeNode = nodes.find(n => n.id === marriage.wife_id)

    if (husbandNode && !wifeNode && !addedSpouseNodes.has(marriage.wife_id)) {
      // Wife is a "married-in" person not in main tree
      const wife = persons.find(p => p.id === marriage.wife_id)
      if (wife) {
        addedSpouseNodes.add(wife.id)
        nodes.push({
          id: wife.id,
          type: 'personNode',
          position: {
            x: husbandNode.position.x + SPOUSE_OFFSET,
            y: husbandNode.position.y
          },
          data: {
            person: wife,
            spouses: [persons.find(p => p.id === marriage.husband_id)!].filter(Boolean),
            isCollapsed: false,
            hasChildren: false,
            generation: wife.generation
          }
        })
      }
    } else if (wifeNode && !husbandNode && !addedSpouseNodes.has(marriage.husband_id)) {
      // Husband is a "married-in" person not in main tree
      const husband = persons.find(p => p.id === marriage.husband_id)
      if (husband) {
        addedSpouseNodes.add(husband.id)
        nodes.push({
          id: husband.id,
          type: 'personNode',
          position: {
            x: wifeNode.position.x + SPOUSE_OFFSET,
            y: wifeNode.position.y
          },
          data: {
            person: husband,
            spouses: [persons.find(p => p.id === marriage.wife_id)!].filter(Boolean),
            isCollapsed: false,
            hasChildren: false,
            generation: husband.generation
          }
        })
      }
    }

    // Spouse edge
    if (husbandNode || wifeNode) {
      edges.push({
        id: `marriage-${marriage.id}`,
        source: marriage.husband_id,
        target: marriage.wife_id,
        type: 'default',
        style: { stroke: 'var(--color-primary-light)', strokeWidth: 1.5, strokeDasharray: '5,5' },
        data: { relation: 'spouse' },
        animated: false
      })
    }
  }

  // Add generation divider nodes
  let minX = Infinity
  let maxX = -Infinity
  let maxDepth = 0

  nodes.forEach(n => {
    if (n.position.x < minX) minX = n.position.x
    if (n.position.x > maxX) maxX = n.position.x
    if (n.type === 'personNode' && n.data.generation > maxDepth) maxDepth = n.data.generation
  })

  if (minX !== Infinity && maxX !== -Infinity) {
    const width = (maxX - minX) + 800 // extend on both sides
    for (let gen = 1; gen <= maxDepth; gen++) {
      nodes.push({
        id: `gen-${gen}`,
        type: 'generationNode',
        position: { x: minX - 400, y: (gen - 1) * VERTICAL_SPACING - 30 },
        data: { generation: gen, width }
      })
    }
  }

  return { nodes, edges }
}

// Format year from date string
export function formatYear(dateStr?: string | null): string | null {
  if (!dateStr) return null
  return new Date(dateStr).getFullYear().toString()
}

export function formatDateRange(birthDate?: string | null, deathDate?: string | null, isAlive?: boolean): string {
  const birth = formatYear(birthDate)
  if (isAlive) return birth ? `b. ${birth}` : ''
  const death = formatYear(deathDate)
  if (birth && death) return `${birth} – ${death}`
  if (birth) return `b. ${birth}`
  if (death) return `d. ${death}`
  return ''
}
